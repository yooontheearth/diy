<template>
    <div>
        <ul :id="elementId" class="simple-context-menu" v-click-outside="onClickOutside">
            <li v-for="option in options" @click="optionClicked(option)" :class="['simple-context-menu__item', 'icon', option.icon]">
                {{option.name}}
            </li>
        </ul>
    </div>
</template>

<script>
    import Vue from 'vue'
    import vClickOutside from 'v-click-outside'
    Vue.use(vClickOutside)

    export default {
        props: {
            elementId: {
                type: String,
                required: true
            },
            options: {
                type: Array,
                required: true
            },
            isInsideAbsoluteContainer:{
                type:Boolean,
                default:false
            }
        },
        data () {
            return {
                item: null,
                menuWidth: null,
                menuHeight: null
            }
        },
        methods: {
            showMenu (event, item) {
                this.item = item
                var menu = document.getElementById(this.elementId)
                if (!menu) {
                    return
                }
                if (!this.menuWidth || !this.menuHeight) {
                    menu.style.visibility = "hidden"
                    menu.style.display = "block"
                    this.menuWidth = menu.offsetWidth
                    this.menuHeight = menu.offsetHeight
                    menu.removeAttribute("style")
                }

                // MEMO : if the context menu is inside a position absolute element, the menu's position must be calculated from a relative position instead of a global position
                let pageX, innerWidth;
                if(this.isInsideAbsoluteContainer){
                    const contextContainer = menu.parentElement.parentElement;  // MEMO : an element which holds the context menu. The element must be position relative
                    const offset = contextContainer.getBoundingClientRect();
                    pageX = event.pageX - offset.left;  // MEMO : subtract the container's left position from the global position
                    innerWidth = offset.width;  // MEMO : right end. It needs more special treatment if the container isn't at very right of a window, like checking window.innerWidth and offset.right (could be)
                }
                else{
                    pageX = event.pageX;
                    innerWidth = window.innerWidth
                }

                if ((this.menuWidth + pageX) >= innerWidth) {
                    menu.style.left = (pageX - this.menuWidth + 2) + "px"
                } else {
                    menu.style.left = (pageX - 2) + "px"
                }
                if ((this.menuHeight + event.pageY) >= window.innerHeight) {
                    menu.style.top = (event.pageY - this.menuHeight + 2) + "px"
                } else {
                    menu.style.top = (event.pageY + 2) + "px"
                }
                menu.classList.add('simple-context-menu--active')
            },
            hideContextMenu () {
                let element = document.getElementById(this.elementId)
                if (element) {
                    element.classList.remove('simple-context-menu--active');
                }
            },
            onClickOutside (event) {
                this.hideContextMenu()
            },
            optionClicked (option) {
                this.hideContextMenu()
                this.$emit('optionClicked', {
                    item: this.item,
                    option: option
                })
            }
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    $light-grey= #ECF0F1
    $grey= darken($light-grey, 15%)
    $white= #fff
    $black= #333
    .simple-context-menu
        top: 0
        left: 0
        margin: 0
        padding: 0
        display: none
        list-style: none
        position: absolute
        z-index: 1000000
        background-color: $light-grey
        border-bottom-width: 0px
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif
        box-shadow: 0 3px 6px 0 rgba($black, 0.2)
        border-radius: 4px
        &--active
             display: block
        &__item
            display: flex
            color: $black
            cursor: pointer
            padding: 5px 15px
            align-items: center

            &:hover
                background-color: $accent-color3
                color: $white

        li
            margin-left: 4px
            padding-left: 28px
            user-select: none
            &:first-of-type
                margin-top: 4px
            &:last-of-type
                margin-bottom: 4px
        li.icon
            background-size: 24px
            background-position: left center
            background-repeat: no-repeat
            // TODO : tint to lighter gray

        li.icon-delete
            background-image: url("../../public/images/icon-trashbin.svg")
        li.icon-group
            background-image: url("../../public/images/icon-group.svg")

</style>