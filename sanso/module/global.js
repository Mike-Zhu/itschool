//链接数据库的类
const {
	sqlFormat
} = require('../service/connect');
const {
	getSql,
	selectFromSql
} = new sqlFormat();

let code = {

};//存储验证码信息

let provinceObj = {

};

//缓存试卷信息
let paperObj = null;

//缓存用户刷题信息，防止接触数据库太多
let temporaryQuesInfo = []

async function getProvince() {
	const nameArr = await getSql('select distinct title from question_banks'),
		sskey = 'SP00000',
		// idToValue = new Object(),//正向 id -> value
		valueToId = new Object();//反向 value -> id

	nameArr.forEach((res, index) => {
		index = index + 1;
		let len = index.toString().length,
			key = sskey.slice(0, 7 - len) + index.toString();
		valueToId[res.title] = key;
		// idToValue[key] = res.title;
		provinceObj[key] = res.title;
	});
	return {
		provinceObj: provinceObj,
		getCitysKey: valueToId,
		paperNameArray: nameArr //所有试卷的集合
	}
}
async function provinceCache() {
	if(!!paperObj){
		return paperObj
	}else{
		paperObj = {}
		const paperSqlInfo = await selectFromSql('papers');
		paperSqlInfo.forEach(result => {
			paperObj[result.id] = result
		})
		return paperObj
	}
}
module.exports = {
	codeObj: code,
	getProvince: getProvince,//获取城市，试卷名相关信息
	provinceObj: provinceObj,//id与城市的对应
	provinceCache: provinceCache,//缓存城市
	temporaryQuesInfo:temporaryQuesInfo
}