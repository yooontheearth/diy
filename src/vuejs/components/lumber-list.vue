<template lang="pug">
        #lumber-list-container(:style="{height: height +'px'}")
            transition(name='bar-only')
                .size-container(v-if="visible")
                    .caption Size
                    .item.selectable(v-for="s in sizes" :class="{ selected: s.selected }" @click="s.toggle()")
                        div {{ s.label }}
                        div
                            | (
                            unit-length-label(:value="s.h")
                            | x
                            unit-length-label(:value="s.w")
                            |  {{ settings.unit }})

            transition(name='bar-only')
                .feet-container(v-if="visible")
                    .caption Length
                    .item.selectable(v-for="f in feet" :class="{ selected: f.selected }" @click="f.toggle()")
                        div {{ f.label }}
                        div
                            | (
                            unit-length-label(:value="f.l")
                            |  {{ settings.unit }})

            transition(name='bar-only')
                .operation-container(v-if="visible")
                    .caption How Many?
                    div
                        input(v-model.number="number" type="number")
                        button(@click="add") Add
                    .message {{ message }}
            .toggle-bar(@click="toggle")
                .selectable Lumber

</template>

<script>
    import UnitLengthLabel from './unit-length-label'
    import settings from '../config'

    class SelectableItem{
        constructor(){
            this.selected = false;
        }
        toggle(){
            this.selected = !this.selected;
        }
    }
    class Size extends SelectableItem{
        constructor(h, w, label){
            super();
            this.h = h;
            this.w = w;
            this.label = label;
        }
    }
    class Feet extends SelectableItem{
        constructor(l, label){
            super();
            this.l = l;
            this.label = label;
        }

    }
    export default {
        props:{
            defaultVisibility:{ default: true},
            height:{required:true}
        },
        data:function(){
            return {
                sizes:[
                    new Size(0.019, 0.019, '1x1'),
                    new Size(0.019, 0.038, '1x2'),
                    new Size(0.019, 0.063, '1x3'),
                    new Size(0.019, 0.089, '1x4'),
                    new Size(0.019, 0.140, '1x6'),
                    new Size(0.019, 0.184, '1x8'),
                    new Size(0.019, 0.235, '1x10'),
                    new Size(0.038, 0.038, '2x2'),
                    new Size(0.038, 0.063, '2x3'),
                    new Size(0.038, 0.089, '2x4'),
                    new Size(0.038, 0.140, '2x6'),
                    new Size(0.038, 0.184, '2x8'),
                    new Size(0.038, 0.235, '2x10'),
                    new Size(0.038, 0.286, '2x12'),
                    new Size(0.063, 0.089, '3x4'),
                    new Size(0.063, 0.140, '3x6'),
                    new Size(0.089, 0.089, '4x4'),
                    new Size(0.089, 0.140, '4x6'),
                    new Size(0.089, 0.184, '4x8')
                ],
                feet:[
                    new Feet(0.91, '3 ft'),
                    new Feet(1.82, '6 ft'),
                    new Feet(2.438, '8 ft'),
                    new Feet(3.05, '10 ft'),
                    new Feet(3.65, '12 ft')
                ],
                number:1,
                message: '',
                settings:settings,
                visible:this.defaultVisibility
            }
        },
        methods:{
            toggle(){
                this.visible = !this.visible;
            },
            add(){
                const sizes = this.sizes.filter(s => s.selected);
                const feet = this.feet.filter(f => f.selected);
                if(sizes.length === 0 || feet.length === 0 || this.number <= 0){
                    this.message = "Please select, at least, one size, length and put proper number.";
                    return;
                }
                else
                    this.message = "";
                const info = Array(this.number).fill()
                                                .map(i => sizes.map(s => feet.map(f => {
                                                    return { height:s.h, width:s.w, length:f.l, label:`${s.label} ${f.label}` };
                                                })))
                                                .reduce((acc, next) => acc.concat(next))
                                                .reduce((acc, next) => acc.concat(next));
                this.$emit('add', info);
                sizes.forEach(s => s.selected = false);
                feet.forEach(f => f.selected = false);
            }
        },
        components:{
            UnitLengthLabel
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    selectableList($width, $labelWidth, $hoverColor, $selectedColor)
        width: $width
        > .item
            fixHeight()
            padding: $small-padding
            display: flex
            text-align: right
            user-select: none
            &.selected
                background-color: $selectedColor
            &:hover
                background-color: $hoverColor
            > div
                padding: 0 $small-padding
            > div:nth-child(1)
                width: $labelWidth
            > div:nth-child(2)
                width: ($width - $labelWidth)

    fixHeight()
        overflow-y: hidden
        height: 18px
    unfixHeight()
        overflow-y: auto
        height: auto

    #lumber-list-container
        position:absolute
        display: flex
        z-index: 1
        background-color: white
        frame()

        > .size-container,
        > .feet-container,
        > .operation-container
            frame()
            overflow-y: hidden
            > .caption
                caption()
                fixHeight()

        > .size-container
            selectableList(150px, 30px, $accent-color3,$accent-color4 )
        > .feet-container
            selectableList(140px, 40px, $accent-color3,$accent-color4 )
        > .operation-container
            width: 100px
            > div
                padding: $small-margin
                fixHeight()
            > .message
                unfixHeight()
                color: red

            input
                width: 40px
                text-align: right

        toggleBar()

    toggleBarAnimation(-100px)
</style>