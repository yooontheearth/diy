<template lang="pug">
    div
        .item(:style="indent" :class="{ selected: item.isSelected, droppable: droppable, dragging:dragging }" @click="toggleItem($event, item)"
              draggable=true @dragstart="dragStart" @dragend="dragEnd" @drop="drop" @dragenter="dragEnter" @dragleave="dragLeave" @dragover.prevent)
            .icon.toggleHandle(v-if="!!item.childItems" @click.stop="toggleChildren" :class="{ 'icon-opened':visibleChildren, 'icon-closed':!visibleChildren }")

            .selectable
                .icon(:class="['icon-item', item.icon]") {{ item.name || 'No name' }}
                .icon.icon-menu(@click.stop="showMenu($event, item)")

        item-list-item(v-for="(child, index) in item.childItems" v-if="!!item.childItems && visibleChildren"
                        v-bind="{item:child, toggleItem, showMenu, depth: depth+1, context }" :key="index")


</template>

<script>
    import _ from 'lodash'
    import Utils from '../util'

    export default {
        props:['item', 'toggleItem', 'showMenu', 'depth', 'context'],
        name: 'item-list-item',
        data: function(){
            return {
                visibleChildren:true,
                indent:  { 'padding-left': `${this.depth * 10}px` },
                droppable:false,
                dragging:false
            }
        },
        methods:{
            toggleChildren: function(){
                this.visibleChildren = !this.visibleChildren;
            },
            dragStart(ev){
                ev.dataTransfer.setData('id', this.item.id);
                ev.dataTransfer.effectAllowed = "move";
                this.dragging = true;
            },
            dragEnd(ev){
                this.dragging = false;
            },
            drop(ev){
                this.droppable = false;
                const droppedItemId = parseInt(ev.dataTransfer.getData('id'));
                if(droppedItemId === this.item.id)
                    return;

                const droppedItem = this.context.uiItems.find(item => item.id === droppedItemId);
                if(!!droppedItem.parentGroup){
                    droppedItem.parentGroup.removeChild(droppedItem);
                }

                let items;
                if(!!this.item.parentGroup){
                    this.item.parentGroup.insertItemAfter(this.item, droppedItem);
                }
                else{
                    items = this.context.items;
                    Utils.removeItem(this.context.items, droppedItem);
                    Utils.insertItemAfter(this.context.items, this.item, droppedItem);
                }
            },
            dragEnter(ev){
                ev.dataTransfer.dropEffect = "move";
                this.droppable = true;
            },
            dragLeave(ev){
                this.droppable = false;
            },
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    .item
        frame()
        padding: $small-padding
        height: 18px
        display: flex

        &.dragging
            background-color: $gray2 !important
        &.droppable
            background-color: $gray1 !important
            *
                pointer-events: none
        &.selected
            background-color: $accent-color4
        &:hover:not(.droppable)
            background-color: $accent-color3

        .icon
            background-position: left center
            background-repeat: no-repeat

        > .toggleHandle
            width: 18px
            &.icon-opened
                background-image: url("../../public/images/icon-opened.svg")
            &.icon-closed
                background-image: url("../../public/images/icon-closed.svg")

        > .selectable
            display: flex
            flex-grow: 1

            > div
                padding: 0 $small-padding
                overflow: hidden
                text-overflow: ellipsis
                user-select: none

            > .icon-item
                margin-left: 4px
                background-size: 20px
                padding-left: 26px

            // TODO : tint to lighter gray
            // TODO : change to better icon
            > .icon-lumber
                background-image: url("../../public/images/icon-lumber.svg")
            > .icon-group
                background-image: url("../../public/images/icon-group.svg")

            > .icon-menu
                width: 20px
                height: 18px
                margin-left: auto
                border: 1px solid transparent
                border-radius: $small-margin
                background-size: 24px
                background-position: center
                background-color: white
                background-image: url("../../public/images/icon-menu.svg")
                iconAction()

</style>