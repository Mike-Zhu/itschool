//链接数据库的类
const {
	sqlFormat
} = require('../service/connect');
const { city, province } = require('../../bin/config');
const {
	getSql,
	selectFromSql,
	insertToSql,
	updateToSql
} = new sqlFormat();
const { checkHeader } = require('../service/check');
const { provinceCache } = require('./global');

class QuestionBank {
	static async getPaper(ctx, next) {
		const { user_id, paperId } = ctx.query;
		const isValid = await checkHeader(ctx.request, user_id);
		const provinceObjectCache = await provinceCache();

		if (!isValid) {
			ctx.response.body = {
				type: 'false',
				data: '登录错误，请重新登录'
			}
			return;
		};
		if (!paperId || !provinceObjectCache[paperId]) {
			ctx.response.body = {
				type: 'false',
				data: '试卷id错误'
			}
			return;
		}
		const questionArray = await selectFromSql('question_banks', {
			'FIND_IN_SET': '("' + provinceObjectCache[paperId].title + '",`title`)'
		});
		if (!questionArray) {
			ctx.response.body = {
				type: 'false',
				data: '发生错误，请重试'
			}
			return;
		};
		ctx.response.body = {
			type: 'true',
			data: questionArray
		}
	}
	//获取单套试卷
	static async getSinglePaperInfo(ctx, next) {
		const { user_id, paperId } = ctx.query;
		const isValid = await checkHeader(ctx.request, user_id);
		if (!isValid) {
			ctx.response.body = {
				type: 'false',
				data: '登录错误，请重新登录'
			}
			return;
		};
		let returnData = {};
		let paperArray = paperId.split(',');
		if (paperArray.length === 1) {
			returnData = await getOnePaperInfo(paperId)
		} else if (paperArray.length > 1) {
			returnData = await getArrayPaperInfo(paperArray)
		}
		ctx.response.body = {
			type: 'true',
			data: returnData
		}
	}

	//获取试卷详情
	static async getPaperType(ctx, next) {
		const { user_id } = ctx.query;
		const isValid = await checkHeader(ctx.request, user_id);
		if (!isValid) {
			ctx.response.body = {
				type: 'false',
				data: '登录错误，请重新登录'
			}
			return;
		};
		//获取试卷对象
		const paperNameArray = await provinceCache();
		const typeObject = await transObjToProvice(paperNameArray);
		ctx.response.body = {
			type: true,
			data: typeObject
		}
	}
}
module.exports = QuestionBank;


async function getOnePaperInfo(paperId) {
	try {
		const paperInfo = await selectFromSql('papers', {
			"id": ` = "${paperId}"`
		})
		if (paperInfo && paperInfo[0]) {
			return paperInfo[0]
		} else {
			return {}
		}
	} catch (e) {
		return {}
	}

}

async function getArrayPaperInfo(paperId) {
	try {
		const paperInfo = await selectFromSql('papers')
		const returnInfo = paperInfo.filter(oneInfo => {
			return paperId.indexOf(oneInfo['id']) >= 0
		})
		return returnInfo
	} catch (e) {
		return []
	}

}

async function transObjToProvice(paperNameArray) {
	const provinceArray = ['安徽', '北京', '上海', '天津', '重庆', '河北', '山西', '内蒙古',
		'辽宁', '吉林', '黑龙江', '江苏', '浙江', '福建', '江西', '山东',
		'河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州',
		'云南', '西藏', '陕西', '甘肃', '宁夏', '青海', '新疆', '香港',
		'澳门', '台湾', '国家', '北京', '上海', '天津', '重庆'
	],
		cityArray = ['北京', '上海', '天津', '重庆', '广州', '深圳'],
		quArray = ['内蒙古', '宁夏', '西藏', '新疆'];
	let typeObject = [];

	for (let key in paperNameArray) {
		let result = paperNameArray[key], typeName;
		const { title } = result;
		if (title.indexOf('国家') >= 0) {
			typeName = '国考';
		} else if (isCity(title, quArray).type) {
			let index = isCity(title, quArray).idx;
			typeName = quArray[index] + '区考';
		} else if (isCity(title, cityArray).type) {
			let index = isCity(title, cityArray).idx;
			typeName = cityArray[index] + '市考';
		} else {
			let idx = checkProvince(title);
			typeName = provinceArray[idx] + '省考';
		};
		typeObject = pushInType(typeObject, typeName, result);
	}
	return typeObject

	function isCity(key, cityArray) {
		let index = -1;
		cityArray.forEach((res, idx) => {
			if (key.indexOf(res) >= 0) {
				index = idx;
			}
		})
		if (index >= 0) {
			return {
				type: true,
				idx: index
			}
		} else {
			return {
				type: false
			}
		}
	}

	function checkProvince(key) {
		let index = -1;
		provinceArray.forEach((res, idx) => {
			if (key.indexOf(res) >= 0) {
				index = idx;
			}
		})
		return index;
	}

	function pushInType(arr, key, info) {
		//检测有没有这个区的，如果没有就新建
		if (!arr.some((res) => {
			if (res.title === key) {
				res.data.push(info)
			}
			return res.title === key;
		})) {
			arr.push({
				title: key,
				data: [info]
			})
		}
		return arr
	}
}