<template lang="pug">
#right-side-container(:style="{height: height +'px'}")
    .v-splitter(v-if="visible" @mousedown="resizeStart")
    .toggle-bar(@click="toggle")
        .selectable Items
        .icon.icon-list(@click.stop="toggleList" title="Item list" :class="{'icon-active' : visibleList }")
        .icon.icon-properties(@click.stop="toggleProperties" title="Item's properties" :class="{'icon-active' : visibleProperties }")

    transition(name='bar-only')
        .content(v-if="visible" :style="{width: width +'px'}")
            transition(name='fade')
                item-list(:context="context" :handler="handler" v-if="visibleList")
            transition(name='fade')
                mesh-prop-viewer(:handler="handler" v-if="visibleProperties")

            transition(name='fade')
                .none-message(v-if="!visibleProperties && !visibleList") Nothing to show
</template>

<script>
    import _ from 'lodash'
    import Utils from '../util'
    import ItemList from './item-list'
    import MeshPropViewer from './mesh-prop-viewer'

    export default {
        props:{
            context:{ required:true },
            handler:{ required:true },
            height:{required:true}
        },
        data: function(){
            return {
                visible:true,
                visibleProperties:true,
                visibleList:true,
                width:160,
                startX:0,
                dragging:false
            }
        },
        components:{
            ItemList,
            MeshPropViewer
        },
        methods:{
            toggle(){
                this.visible = !this.visible;
            },
            toggleProperties(){
                this.visibleProperties = !this.visibleProperties;
            },
            toggleList(){
                this.visibleList = !this.visibleList;
            },
            resizeStart(ev){
                this.startX = ev.x;
                this.dragging = true;

                window.addEventListener('mousemove',this.resize);
                window.addEventListener('mouseup',this.resizeEnd);
            },
            resize(ev){
                if(!this.dragging)
                    return;
                this.width += (this.startX - ev.x);
                this.startX = ev.x;
            },
            resizeEnd(ev){
                if(!this.dragging)
                    return;
                this.width += (this.startX - ev.x);
                this.dragging = false;

                window.removeEventListener('mousemove', this.resize);
                window.removeEventListener('mouseup',this.resizeEnd);
            }
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    #right-side-container
        position: absolute
        right:0px
        display: flex
        background-color: white

        > .v-splitter
            width: 10px;
            background: $gray1

            &:hover
                background: $gray2
                cursor: col-resize;

        toggleBar()

        > .toggle-bar
            > .selectable:first-child
                width: 6px  // MEMO : necessary to tweak to push out the icons below
                height: 22px
                transform-origin: 50% 50%
                margin-bottom: 40px
            > .icon
                background-size: 34px
                width: 24px
                height: 30px
                border: 1px solid $accent-color4
                background-position: center
                margin: $small-margin*2 $small-margin*-1
                background-color: white
                iconAction()

            > .icon-active
                transform: translateY(1px) !important
                box-shadow: 0 -2px #aaa !important
                background-color: $accent-color4
            > .icon-list
                background-image: url("../../public/images/icon-list.svg")
            > .icon-properties
                background-image: url("../../public/images/icon-property.svg")

        .content
            width: 160px    // MEMO : width is necessary for animation

            > .none-message
                width: 100px
                message()

        fadeAnimation()
        toggleBarAnimation(10px)
</style>