const {privilegedUsers} = require("../../config/admins.json");

/**
 * @param {proto.IWebMessageInfo} message
 * @param {groupMetadata} metadata
 * @return {boolean}
 */
const isGroupAdmin = (message, metadata)=>{
    return metadata.participants.find(par=>par.id===message.key.participant).admin !==null;
}

/**
 *
 * @param {string} phoneId
 * @param {groupMetadata} metadata
 * @return {boolean}
 */
const isGroupAdminId = (phoneId, metadata)=>{
    return metadata.participants.find(par=>par.id===phoneId).admin !==null;
}

/**
 * Checks if message has been sent by a privileged user.
 * @param {proto.IWebMessageInfo} message
 * @return {boolean}
 */
const isPrivileged = (message) => {
    return message.key.fromMe || privilegedUsers.includes(
        message.key.participant || message.key.remoteJid);
};

/**
 *
 * @param {string} id
 * @return {boolean}
 */
const isPrivilegedId = (id)=>{
    return privilegedUsers.includes(id);
}


module.exports = {
    isGroupAdmin,
    isPrivileged,
    isPrivilegedId,
    isGroupAdminId
}
