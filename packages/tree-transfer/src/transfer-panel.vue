<template>
    <div class="el-transfer-panel">
        <p class="el-transfer-panel__header">
        <el-checkbox
            v-model="allChecked"
            @change="handleAllCheckedChange"
            :indeterminate="isIndeterminate">
            {{ title }}
            <!-- <span>{{ checkedSummary }}</span> -->
        </el-checkbox>
        </p>

        <div :class="['el-transfer-panel__body', hasFooter ? 'is-with-footer' : '']">
        <el-input
            class="el-transfer-panel__filter"
            v-model="query"
            size="small"
            :placeholder="placeholder"
            @mouseenter.native="inputHover = true"
            @mouseleave.native="inputHover = false"
            v-if="filterable">
            <i slot="prefix"
                :class="['el-input__icon', 'el-icon-' + inputIcon]"
                @click="clearQuery"
            ></i>
        </el-input>

        <div v-show="data.length > 0"
            :class="{ 'is-filterable': filterable }"
            class="el-transfer-panel__list">

            <el-tree ref="tree" :data="filteredData"
                :node-key="keyProp"
                show-checkbox
                default-expand-all
                :default-checked-keys="checked"
                :filter-node-method="filterNode"
                :render-content="renderContent"
                @check="handleCheck">
                <template slot-scope="{ node, data }">
                    <option-content :option="{node, data}"></option-content>
                </template>
            </el-tree>
        </div>

            <p
            class="el-transfer-panel__empty"
            v-show="data.length === 0">{{ '暂无数据' }}</p>
        </div>
        <p class="el-transfer-panel__footer" v-if="hasFooter">
            <slot></slot>
        </p>
    </div>
</template>

<script>
import { deepCopy } from '../../../src/util/deepCopy'

export default {

    name: 'ElTransferPanel',

    componentName: 'ElTransferPanel',

    components: {

        OptionContent: {
            props: {
                option: Object
            },
            render (h) {
                const getParent = vm => {
                    if (vm.$options.componentName === 'ElTransferPanel') {
                        return vm
                    } else if (vm.$parent) {
                        return getParent(vm.$parent)
                    } else {
                        return vm
                    }
                }
                const panel = getParent(this)
                const transfer = panel.$parent || panel
                return panel.renderContent
                    ? panel.renderContent(h, this.option)
                    : transfer.$scopedSlots.default
                        ? transfer.$scopedSlots.default({ option: this.option })
                        : <span>{ this.option.data[panel.labelProp] || this.option.data[panel.keyProp] }</span>
            }
        }
    },

    props: {
        data: {
            type: Array,
            default () {
                return []
            }
        },
        renderContent: Function,
        placeholder: String,
        title: String,
        filterable: Boolean,
        format: Object,
        filterMethod: Function,
        defaultChecked: Array,
        props: Object
    },

    data () {
        return {
            checked: [],
            halfChecked: [],
            allChecked: false,
            query: '',
            inputHover: false,
            checkChangeByUser: true
        }
    },

    watch: {
        checked (val, oldVal) {
            this.updateAllChecked() // 判断是否全选
            if (this.checkChangeByUser) {
                const movedKeys = val.concat(oldVal)
                    .filter(v => val.indexOf(v) === -1 || oldVal.indexOf(v) === -1)
                this.$emit('checked-change', val, movedKeys, this.halfChecked)
            } else {
                this.$emit('checked-change', val)
                this.checkChangeByUser = true
            }
        },

        data () {
            const checked = []
            const filteredDataKeys = this.getAllChecked(this.checkableData)
            this.checked.forEach(item => {
                if (filteredDataKeys.indexOf(item) > -1) {
                    checked.push(item)
                }
            })
            this.checkChangeByUser = false
            this.checked = checked
        },

        checkableData () {
            this.updateAllChecked()
        },

        defaultChecked: {
            immediate: true,
            handler (val, oldVal) {
                if (oldVal && val.length === oldVal.length &&
                val.every(item => oldVal.indexOf(item) > -1)) return
                const checked = []
                const checkableDataKeys = this.getAllChecked(this.checkableData)
                val.forEach(item => {
                    if (checkableDataKeys.indexOf(item) > -1) {
                        checked.push(item)
                    }
                })
                this.checkChangeByUser = false
                this.checked = checked
            }
        },

        query (val) {
            this.$refs.tree.filter(val)
        }
    },

    computed: {
        filteredData () { // tree 渲染数据
            return this.data
        },

        checkableData () {
            const dataCopy = deepCopy(this.data)

            const filterFun = (list) => {
                return list.filter(item => {
                    if (item[this.childrenProp]) {
                        item[this.childrenProp] = filterFun(item[this.childrenProp])
                    }
                    return !item[this.disabledProp]
                })
            }

            return filterFun(dataCopy)
        },

        isIndeterminate () {
            const checkedLength = this.checked.length

            const filteredDataKeys = this.getAllChecked(this.checkableData)

            return checkedLength > 0 && checkedLength < filteredDataKeys.length
        },

        inputIcon () {
            return this.query.length > 0 && this.inputHover
                ? 'circle-close'
                : 'search'
        },

        labelProp () {
            return this.props.label || 'label'
        },

        childrenProp () {
            return this.props.children || 'children'
        },

        keyProp () {
            return this.props.key || 'key'
        },

        disabledProp () {
            return this.props.disabled || 'disabled'
        },

        hasFooter () {
            return !!this.$slots.default
        }
    },

    methods: {
        filterNode (value, data) { // tree 筛选
            if (this.filterMethod) {
                return this.filterMethod(value, data)
            }
            if (!value) return true
            return data[this.labelProp].indexOf(value) !== -1
        },

        updateAllChecked () {
            const checkableDataKeys = this.getAllChecked(this.checkableData)
            this.allChecked = checkableDataKeys.length > 0 &&
                checkableDataKeys.every(item => this.checked.indexOf(item) > -1)
        },

        handleAllCheckedChange (value) {
            const checks = []
            const getChecked = (list) => {
                list.forEach(item => {
                    if (item[this.childrenProp] && item[this.childrenProp].length > 0) {
                        getChecked(item[this.childrenProp])
                    } else {
                        checks.push(item.key)
                    }
                })
            }
            getChecked(this.checkableData)

            if (value) {
                this.$refs.tree.setCheckedKeys([...checks])
            } else {
                this.$refs.tree.setCheckedKeys([])
            }

            this.checked = this.$refs.tree.getCheckedKeys()
        },

        getAllChecked (list) {
            const keys = []
            list.forEach(item => {
                keys.push(item[this.keyProp])
                if (item[this.childrenProp]) {
                    keys.push(...this.getAllChecked(item[this.childrenProp]))
                }
            })
            return keys
        },

        clearQuery () {
            if (this.inputIcon === 'circle-close') {
                this.query = ''
            }
        },

        handleCheck (cur, checkedInfo) {
            const { checkedKeys, halfCheckedKeys } = checkedInfo
            this.checked = checkedKeys
            this.halfChecked = halfCheckedKeys
        }
    }
}
</script>
