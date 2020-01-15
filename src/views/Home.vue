<template>
    <div class="home">
        <i-el-transfer
            v-model="value"
            :data="data"
            filterable>
        </i-el-transfer>
        <div>
            <p>v-model: {{value}}</p>
        </div>
    </div>
</template>

<script>
import iElTransfer from '../components/main'

export default {
    name: 'home',
    components: {
        iElTransfer
    },
    data () {
        return {
            value: [],
            data: [
                {
                    key: 1,
                    label: '备选项1',
                    disabled: false,
                    children: [
                        {
                            key: 11,
                            label: '备选项11',
                            disabled: false,
                            children: [
                                { key: 111, label: '备选项111', disabled: false },
                                { key: 112, label: '备选项112', disabled: false },
                                { key: 113, label: '备选项113', disabled: false }
                            ]
                        },
                        { key: 12, label: '备选项12', disabled: false },
                        { key: 13, label: '备选项13', disabled: false }
                    ]
                },
                { key: 2, label: '备选项2', disabled: false },
                { key: 3, label: '备选项3', disabled: false },
                { key: 4, label: '备选项4', disabled: false },
                { key: 5, label: '备选项5', disabled: false }
            ]
        }
    },
    methods: {

    }
}
</script>

<style lang="less" scoped>
.home {
    margin-top: 150px;
    & /deep/ .el-transfer-panel__header {
        text-align: left;
    }
}
</style>
