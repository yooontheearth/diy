<template lang="pug">
.item
    .caption(v-if="type === 'mm'" ) {{ label }} ({{ settings.unit }})
    .caption(v-else ) {{ label }}
    .prop(v-for="(p, index) in ['x', 'y', 'z']")
        div {{ propLabels[index] }}
        div
            unit-length-input(v-if="type === 'mm'" v-model="obj[p]" @input="changed($event, p)" :correct-value="correctValue")
            number-input-base(v-else v-model="obj[p]" @input="changed($event, p)" :correct-value="correctValue")
</template>

<script>
    import NumberInputBase from './number-input-base'
    import UnitLengthInput from './unit-length-input'
    import settings from '../config'

    /* MEMO : 'change' event is fired only when a value actually changed by a user.
    *
    * The obj property itself is recreated all the time when GL.Vector is calculated with add, subtract, etc
    * so detecting a change of the obj is not possible.
    *
    * The properties of the obj, x, y ,z are changed when a selected mesh is changed because they have a different value on its own.
    * But only when a value is actually changed, 'change' event should be fired.
    *
    * So, first hooking 'input' event, then 'watch' a property, so that this component can detect actual change.
    *
    * watch is used because an old value is necessary in most of scenario.
    * */
    let actuallyValueChanged = {
        'x':false,
        'y':false,
        'z':false,
    };
    function createWatcher(property){
        return function(newValue, oldValue){
            if(actuallyValueChanged[property]){
                this.$emit('change', newValue, oldValue, property);
            }
            actuallyValueChanged[property] = false;
        }
    }

    export default {
        data: function(){
            return {
                settings
            }
        },
        props:{
            label: {
                type: String,
                required: true
            },
            propLabels:{
                default:function(){ return ['x', 'y', 'z']; }
            },
            obj:{
                required:true
            },
            type:{
                default:'number'
            },
            correctValue:{
                default:function(){return function(value){ return value; }; }
            }
        },
        components:{
            NumberInputBase,
            UnitLengthInput
        },
        methods:{
            changed:function(newValue, property){
                actuallyValueChanged[property] = true;
            }
        },
        watch:{
            'obj.x':createWatcher('x'),
            'obj.y':createWatcher('y'),
            'obj.z':createWatcher('z')
        }
    }
</script>

<style scoped lang="stylus">
    @import '../css/common.styl'

    propertyItem()
</style>