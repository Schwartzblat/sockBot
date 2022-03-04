const {removeFirstWord} = require('../../utils/stringUtils');
const axios = require('axios');

const listUrl = 'https://shkifut.education.gov.il/api/data/lists';
const baseUrl = 'https://shkifut.education.gov.il/api/data/mosad/?semelMosad='


/**
 *
 * @return {Promise<object>}
 */
const getSchoolList = async ()=>{
  const response = await axios.get(listUrl).catch(err=>err);
  if(!response || response.status !== 200) {
    return;
  }
  return response.data['infoLists'];
}

/**
 *
 * @param {object} obj
 * @return {boolean}
 */
const isEmpty = (obj)=>{
  for(let key in obj) {
      return false;
  }
  return true;
}

/**
 *
 * @param {string} schoolName
 * @return {Promise<number>}
 */
const findSchool = async (schoolName) => {
  const lists = await getSchoolList();
  if (!lists){
    return -1;
  }
  let indexes = {};
  const parts = schoolName.split(' ');
  for(const item of lists){
    for(let i=0;i<parts.length;i++){
      if(item.n.includes(parts[i]) || (item.a && item.a.includes(parts[i]))){
        if(!indexes[item.s]){
          indexes[item.s] = 1;
        }else {
          indexes[item.s] += 1;
        }
      }
    }
  }
  if(isEmpty(indexes)){
    return -1;
  }
  let max = 0;
  let found = indexes[0];
  for(const key in indexes){
    if(indexes[key]>=max){
      max = indexes[key];
      found = key;
    }
  }
  return found;
};

/**
 * @param {WAWebJS.Message} message
 * @return {Promise<void>}
 */
const procCommand = async (message) => {
  const schoolName = removeFirstWord(message.body);
  const schoolId = await findSchool(schoolName);
  if (!schoolId || schoolId === -1){
    return;
  }
  const response = await axios.get(baseUrl+schoolId+"&year=2020").catch(err=>err);
  if(!response || response.status !== 200) {
    return;
  }
  console.log(response.data)

};
module.exports = procCommand;
// procCommand({
//   body: '!מידע אילון שרון'
// })
