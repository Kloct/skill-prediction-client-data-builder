const fs = require('fs')
const Abnormality = fs.readdirSync("./DC/Abnormality")

/**
 * Abnormality
 */
function generateAbnormality() {
    let abnormalities = {}
    for (let file of Abnormality) {
        const { Abnormal } = require(`./DC/Abnormality/${file}`)
        if (Abnormal != undefined) {
            for (let abnormal of Abnormal) {
                if (abnormal.AbnormalityEffect == undefined) {
                    continue;
                }
                let bySkillCategory = []
                try {
                    bySkillCategory = abnormal.bySkillCategory.split(",").map(e => parseInt(e));
                } catch { }
                let effects = []
                for (let effect of abnormal.AbnormalityEffect) {
                    effects.push({ type: effect.type, method: effect.method, value: (new Number(effect.value)) })
                }
                abnormalities[abnormal.id] = { bySkillCategory, effects }

            }
        }

    }
    fs.writeFileSync("./abnormality.json", JSON.stringify(abnormalities))
}

const EpPerk = require("./DC/EpPerk.json")
const Passivity = mergePassivity("./DC/Passivity")

/**
 * ep and ep_pog
 */

function mergePassivity(path) {
    let files = fs.readdirSync(path)
    let mergedPassive = []
    for (let file of files) {
        mergedPassive = [...require(`${path}/${file}`).Passive, ...mergedPassive]
    }
    return mergedPassive
}
function generateEP() {
    let ep_pog = {}
    let ep = {}
    for (let perk of EpPerk.Perk) {
        ep_pog[`${perk.id},${perk.level}`] = []
        ep[`${perk.id},${perk.level}`] = []
        for (let data of perk.Condition[1].Data) {
            for (let passive of Passivity) {
                if (passive.id == data.id) {
                    ep_pog[`${perk.id},${perk.level}`].push({
                        type: passive.type,
                        method: passive.method,
                        value: new Number(data.value),
                        ...(passive.condition != 0) && { condition: passive.condition },
                        ...(passive.conditionValue != 0) && { conditionValue: new Number(passive.conditionValue) },
                        ...(checkConditionCategory(passive.conditionCategory)) && { conditionCategory: passive.conditionCategory.split(",").map(e => parseInt(e)) }
                    })
                    if (passive.conditionCategory.split(',').length == 1 && parseInt(passive.conditionCategory) != 0) {
                        ep[`${perk.id},${perk.level}`].push({
                            conditionCategory: parseInt(passive.conditionCategory),
                            type: passive.type,
                            method: passive.method,
                            value: new Number(data.value)
                        })
                    }
                }
            }
        }
        if (ep[`${perk.id},${perk.level}`].length == 0) delete ep[`${perk.id},${perk.level}`]
    }
    fs.writeFileSync("./ep_pog.json", JSON.stringify(ep_pog, null, 1))
    fs.writeFileSync("./ep.json", JSON.stringify(ep, null, 0))
}

function checkConditionCategory(conditionCategory) {
    try {
        if (parseInt(conditionCategory) == 0) return false
    } catch { return false }
    return true
}


/**
 * passivity
 */
function generatePassivity() {
    let passivity = {}
    for (let passive of Passivity) {
        if (parseInt(passive.conditionCategory) != 0 && parseInt(passive.conditionCategory) != NaN) {
            passivity[passive.id] = {
                conditionCategory: parseInt(passive.conditionCategory),
                type: passive.type,
                method: passive.method,
                value: new Number(passive.value)

            }
        }
    }
    let subPassives = {}
    //Item Passivities
    const RandomEquipmentPassivity = require('./DC/RandomEquipmentPassivity.json')

    for (let e of RandomEquipmentPassivity.Group) {
        if (e.Passive) {
            for (let passive of e.Passive) {
                if (passive.subPassive != undefined)
                    subPassives[passive.id] = passive.subPassive.split(",")
            }
        } else if (e.method && e.value.split(",").length == 1 && e.prob.split(",").length == 1) {
            passivity[e.id] = {
                type: e.type,
                method: e.method,
                value: new Number(e.value)
            }
        }
    }

    fs.writeFileSync("./passivity.json", JSON.stringify(passivity, null, 0))
    fs.writeFileSync("./subPassives.json", JSON.stringify(subPassives, null, 0))
}


/**
 * polishing
 */
function generatePolishing() {
    const { SkillPolishingEffect } = require("./DC/SkillPolishingEffectList.json")

    let polishing = {}
    for (let effect of SkillPolishingEffect) {
        polishing[effect.id] = []
        for (let passive of effect.Cost[1].Passive) {
            polishing[effect.id].push(passive.id)
        }
    }
    fs.writeFileSync("./polishing.json", JSON.stringify(polishing, null, 0))
}


/**
 * noctan
 */
function generateNoctan() {
    const ClassIDs = [
        "warrior",
        "lancer",
        "slayer",
        "berserker",
        "sorcerer",
        "archer",
        "priest",
        "elementalist",
        "soulless",
        "engineer",
        "fighter",
        "assassin",
        "glaiver"
    ]
    const { NoctanPerformanceSet } = require("./DC/NocTanData.json")
    const effectThreshold = 1.0
    let noctan = {}
    for (let performanceSet of NoctanPerformanceSet) {
        if (performanceSet.NocTanSkillData)
            for (let skillData of performanceSet.NocTanSkillData) {
                if (new Number(skillData.effectRate) > effectThreshold && skillData.effectType == 3) {
                    if (!noctan[ClassIDs.indexOf(skillData.class)]) noctan[ClassIDs.indexOf(skillData.class)] = {}
                    noctan[ClassIDs.indexOf(skillData.class)][skillData.skillId] = new Number(skillData.effectRate)
                }
            }
    }
    fs.writeFileSync("./noctan.json", JSON.stringify(noctan, null, 0))
}

//generateAbnormality();
//generateEP();
//generateNoctan();
generatePassivity();
//generatePolishing();
