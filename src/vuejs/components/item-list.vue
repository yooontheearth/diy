<template lang="pug">
#item-list-container
    .caption List
    div(v-if="context.uiItems.length > 0" )
        item-list-item(v-for="(item, index) in context.rootUiItems"
                        v-bind="{item, toggleItem, showMenu, depth:0, context }" :key="index")

    simple-context-menu(:elementId="'item-list-context-menu'"
                        :isInsideAbsoluteContainer="true"
                        :options="itemOptions"
                        ref="itemContextMenu"
                        @optionClicked="optionClicked")

    simple-context-menu(:elementId="'group-list-context-menu'"
                        :isInsideAbsoluteContainer="true"
                        :options="groupOptions"
                        ref="groupContextMenu"
                        @optionClicked="optionClicked")

</template>

<script>
    import _ from 'lodash'
    import Utils from '../util'
    import SimpleContextMenu from './simple-context-menu'
    import { Group } from '../csg/csg-ui-items'
    import ItemListItem from './item-list-item'

    export default {
        props:{
            context:{ required:true },
            handler:{ required:true }
        },
        components:{
            SimpleContextMenu,
            ItemListItem
        },
        data: function(){
            return {
                itemOptions: [
                    {name:'Create Group', action:'createGroup', icon:'icon-group'},
                    {name:'Remove from Group', action:'removeFromGroup', icon:'icon-delete'},
                    {name:'Delete', action:'deleteItem', icon:'icon-delete'}
                ],
                groupOptions: [
                    {name:'Create Group', action:'createGroup', icon:'icon-group'},
                    {name:'Remove from Group', action:'removeFromGroup', icon:'icon-delete'},
                    {name:'Delete', action:'deleteGroup', icon:'icon-delete'}
                ]
            }
        },
        methods:{
            toggleItem:function(e, item){
                if (e.shiftKey) this.selectWithShift(item);
                else if (e.ctrlKey) this.selectWithControl(item);
                else this.selectNormally(item);
            },
            selectNormally(item){
                this.context.unselectAllItems();
                item.isSelected = true;
                this.context.updateSelectedItems();
            },
            selectWithControl:function(item){
                item.isSelected = !item.isSelected;
                this.context.updateSelectedItems();
            },
            selectWithShift:function(item){
                const selectedItems = this.context.selectedUiItems;
                if(selectedItems.length > 0){
                    const firstSelectedMesh = selectedItems[0];
                    let isWithinRange = false;
                    this.context.uiItemsInUiOrder.forEach(m => {
                       if(m === item || m === firstSelectedMesh){
                           m.isSelected = true;
                           isWithinRange = !isWithinRange;
                       }
                       else{
                           m.isSelected = isWithinRange;
                       }
                    });
                }
                else{
                    item.isSelected = true;
                }
                this.context.updateSelectedItems();
            },
            showMenu:function(e, item){
                this.$refs.itemContextMenu.showMenu(e, item);
            },
            createGroup:function(item){
                const group = new Group();

                if(!item.isSelected && !item.parentGroup)    // MEMO : even if the item (which shows the menu) is not selected, add to the group
                    group.addChild(item);

                this.context.selectedUiItems.filter(s => !s.parentGroup).forEach(s => group.addChild(s));
                this.context.addItem(group);
            },
            removeFromGroup:function(item){
                if(!!item.parentGroup) {
                    item.parentGroup.removeChild(item);
                }
            },
            deleteItem:function(item){
                this.context.removeItems([item]);
            },
            optionClicked:function(obj){
                this[obj.option.action](obj.item);
            }
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    #item-list-container
        position: relative

        > .caption
            caption()
</style>