<template lang="pug">
#mesh-prop-viewer-container
    transition(name='fade')
        div(v-if="handler.visible")
            .item
                .caption Properties
                .prop
                    div Name
                    div
                        input(v-model="handler.name" @input="changeName")

            vector-viewer(:label="'Location'" :obj="handler.visualPos" @change="changePos" :type="'mm'")
            vector-viewer(:label="'Rotation'" :obj="handler.angle" :correct-value="clampAngle" @change="changeAngle")
            vector-viewer(:label="'Size'" :prop-labels="['width', 'length', 'height']" :correct-value="clampSize"
                            :obj="handler.size" @change="changeSize" :type="'mm'")
</template>

<script>
    import vectorViewer from './vector-viewer.vue'
    import _ from 'lodash'
    import Utils from '../util'

    export default {
        props:{
            handler:{ required:true }
        },
        components:{
            vectorViewer
        },
        methods:{
            changePos:function(newValue, oldValue, property){
                this.handler.changePos(newValue, oldValue, property);
            },
            changeAngle:function(newValue, oldValue, property){
                this.handler.changeAngle(newValue, oldValue, property);
            },
            changeSize:function(newValue, oldValue, property){
                this.handler.changeSize(newValue, oldValue, property);
            },
            clampAngle:function(newValue){
                return Utils.clampAngle(newValue);
            },
            clampSize:function(newValue){
                return Math.max(newValue, 10);  // MEMO : minimum size is 10
            },
            changeName:function(newValue){
                this.handler.changeName(this.handler.name);
            }
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    #mesh-prop-viewer-container
        > div
            propertyItem()

        fadeAnimation()

</style>