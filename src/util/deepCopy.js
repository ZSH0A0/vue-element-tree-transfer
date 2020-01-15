/**
 * 实现深克隆---对象/数组
 * @param { Array / Object } target 需要复制的数组或对象
 */
export const deepCopy = (target) => {
    // 判断拷贝的数据类型
    let result
    let targetType = _checkedType(target)
    if (targetType === 'Object') {
        result = {}
    } else if (targetType === 'Array') {
        result = []
    } else {
        return target
    }
    // 遍历目标数据
    for (let i in target) {
        let value = target[i]
        // 判断目标结构里的每一值是否存在对象/数组
        if (_checkedType(value) === 'Object' || _checkedType(value) === 'Array') {
            result[i] = deepCopy(value)
        } else {
            result[i] = value
        }
    }
    return result
}

// 定义检测数据类型的功能函数
const _checkedType = (target) => {
    return Object.prototype.toString.call(target).slice(8, -1)
}
