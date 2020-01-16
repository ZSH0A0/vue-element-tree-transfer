# tree-transfer

最近遇到个需求，穿梭框中的内容是树形结构的数据，但是查看elementUI的transfer组件并不支持树形结构的数据。但是el-tree组件支持啊，让tree组件和transfer组件结合一下岂不完美。

## 准备

clone一份element的源码，找到`package/tansfer/src`文件夹，里面的vue文件就是我们的目标。复制一份出来到自己的项目（同时复制`mixins`里的`emitter.js`和`migrating.js`），接下来就对它进行改造。

此时移动后的目录结构：

```
|-- components
|   |-- mixins
|   |   |-- emitter.js
|   |   |-- migraing.js
|   |-- main.vue
|   |-- transfer-panel.vue
```

## 使用

使用之前先对main.vue，transfer-panel.vue两个文件进行简单的修改。删除locale相关代码。emitter.js和migrating.js因为路径变化需要重新引入。然后在其它组件中引入main.vue就可以使用啦（和直接使用el-transfer是一样的）。

```
<i-el-transfer v-model="value" :data="data"></i-el-transfer>

...

import iElTransfer from '../components/main'

export default {
    name: 'home',
    components: {
        iElTransfer
    },
    data () {
        return {
            data: [
                { key: 1, label: '备选项1', disabled: false },
                { key: 2, label: '备选项2', disabled: false },
                { key: 3, label: '备选项3', disabled: false }
            ]
        }
    }
    ...
}
```

![image](https://note.youdao.com/yws/public/resource/c06d5a41157fd2ed493a5d3163335649/xmlnote/D69BFCEE8B194851A8E076BFC624F8A7/20598)

## 对内容区改造

将原来的单层结构转换成树形结构，我们有现成的el-tree使用，所以将原来显示内容的区域换成el-tree组件。

```
// transfer-panel.vue
...

<el-checkbox-group
    v-model="checked"
    v-show="!hasNoMatch && data.length > 0"
    :class="{ 'is-filterable': filterable }"
    class="el-transfer-panel__list">
    <el-checkbox
        class="el-transfer-panel__item"
        :label="item[keyProp]"
        :disabled="item[disabledProp]"
        :key="item[keyProp]"
        v-for="item in filteredData">
        <option-content :option="item"></option-content>
    </el-checkbox>
</el-checkbox-group>
...
```
不管那么多，先直接替换成el-tree看看

```
...
<div v-show="data.length > 0"
    :class="{ 'is-filterable': filterable }"
    class="el-transfer-panel__list">

    <el-tree ref="tree" :data="filteredData"
        :node-key="keyProp"
        show-checkbox
        default-expand-all
        :default-checked-keys="checked">
    </el-tree>
</div>
...
```

将data变为树形结构再看，回过来看页面

![image](https://note.youdao.com/yws/res/20655/WEBRESOURCE8561e5057d0d57e6ce927bc89e55252a)

是我们像要的结果，这时候虽然变成了我们想要的树形结构，但是操作一下就能发现问题。继续看代码。

```
sourceData() {
    return this.data.filter(item => this.value.indexOf(item[this.props.key]) === -1);
},

targetData() {
    if (this.targetOrder === 'original') {
        return this.data.filter(item => this.value.indexOf(item[this.props.key]) > -1);
    } else {
        return this.value.reduce((arr, cur) => {
            const val = this.dataObj[cur];
            if (val) {
                arr.push(val);
            }
        return arr;
      }, []);
    }
},
```

sourceData和targetData分别用来展示左右两侧的数据，this.value是使用组件时通过v-model绑定的数据。这里通过this.value筛选出左右两边的数据。那我们就在这里做一下修改：

```
sourceData () {
    const data = deepCopy(this.data)

    // 有children继续筛选
    const filterData = (list) => {
        return list.filter(item => {
            if (item[this.props.children] && item[this.props.children].length > 0) {
                item[this.props.children] = filterData(item.children)
            }
            return this.value.indexOf(item[this.props.key]) === -1
        })
    }

    return filterData(data)
},

targetData () {
    const data = deepCopy(this.data)

    const filterData = (list) => {
        const res = []
        list.forEach(item => {
            if (this.value.indexOf(item[this.props.key]) > -1) {
                res.push(item)
            }

            if (item[this.props.children] && item[this.props.children].length > 0) {
                const result = filterData(item[this.props.children])
                if (result.length > 0) {
                    item[this.props.children] = result
                    const find = res.find(i => i.key === item.key)

                    // res 中没有找到 item，需将 item 加入 res。
                    // 避免当选中子元素，父元素未选中的时候出现问题
                    if (find === undefined) {
                        res.push(item)
                    }
                }
            }
        })
        return res
    }

    return filterData(data)
},
```

我这里希望添加到右边的数据和左边的数据保持同样的结构，所以删除了targetOrder选项。我们试着改变v-model绑定的值来看下效果

![image](https://note.youdao.com/yws/res/20652/WEBRESOURCEefe9204082871010ac452b4f08d2387e)

有那感觉了，但是现在向左向右添加的功能还是不行。下面就修改这部分的功能。找到addToRight函数，该函数筛选出用户选中要添加到右侧的数据和已经存在右侧的数据，并通过$emit()修改value的值。

```
addToRight () {
    let currentValue = this.value.slice()
    const itemsToBeMoved = []
    const findSelectkey = (list) => {
        const key = this.props.key
        const itemsToBeMoved = []

        list.forEach(item => {
            const itemKey = item[key]
            if (
                this.leftChecked.indexOf(itemKey) > -1 &&
                this.value.indexOf(itemKey) === -1
            ) {
                itemsToBeMoved.push(itemKey)
            }

            if (item[this.props.children] && item[this.props.children].length > 0) {
                itemsToBeMoved.push(...findSelectkey(item[this.props.children]))
            }
        })
        return itemsToBeMoved
    }

    itemsToBeMoved.push(...findSelectkey(this.data))

    currentValue = currentValue.concat(itemsToBeMoved)

    this.$emit('input', currentValue)
    this.$emit('change', currentValue, 'right', this.leftChecked)
},

```

其实思路都是一样的，如果存在children就继续查找下层数据。接着修改addToLeft函数。

```
addToLeft () {
    let currentValue = this.value.slice()
    const list = this.rightChecked.concat(this.rightFalfChecked)
    list.forEach(item => {
        const index = currentValue.indexOf(item)
        if (index > -1) {
            currentValue.splice(index, 1)
        }
    })
    this.$emit('input', currentValue)
    this.$emit('change', currentValue, 'left', this.rightChecked)
},
```

这里我想的是如果元素的子元素没有被全选，那么该元素不是选中状态，所以要从右侧删除该元素的key。这里新加了一个rightFalfChecked用来表示右侧半选状态的数据。

上面对main.vue文件的修改基本就算完了。我们发现还需要获取到rightChecked、leftChecked、rightFalfChecke的值。修改transfer-panel.vue文件来获取它们。el-tree组件有个check事件，通过它我们可以获取当前el-tree哪些被选中了。

> check：当复选框被点击的时候触发；共两个参数，依次为：传递给 data 属性的数组中该节点所对应的对象、树目前的选中状态对象，包含 checkedNodes、checkedKeys、halfCheckedNodes、halfCheckedKeys 四个属性

```
<el-tree ref="tree" :data="filteredData"
    :node-key="keyProp"
    show-checkbox
    default-expand-all
    :default-checked-keys="checked"
    @check="handleCheck">
</el-tree>

...
watch: {
    checked (val, oldVal) {
        this.updateAllChecked()
        if (this.checkChangeByUser) {
            const movedKeys = val.concat(oldVal)
                .filter(v => val.indexOf(v) === -1 || oldVal.indexOf(v) === -1)
            this.$emit('checked-change', val, movedKeys, this.halfChecked)
        } else {
            this.$emit('checked-change', val)
            this.checkChangeByUser = true
        }
    }
}

...

handleCheck (cur, checkedInfo) {
    const { checkedKeys, halfCheckedKeys } = checkedInfo
    this.checked = checkedKeys
    this.halfChecked = halfCheckedKeys
}
```

到这里基本功能实现都已经完成了，但是还有一些细节问题，比如全选、筛选等，这里就不再描述。相比原来的transfer组件，这里去掉了targetOrder，format属性，其它的则做了保留或修改。

Github：[链接](https://github.com/Gudong1126/vue-element-tree-transfer)
