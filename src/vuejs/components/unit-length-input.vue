<template lang="pug">
    input(:value="normalizedValue" @input="updateSelf($event.target.value)" type="number")
</template>

<script>
    import Utils from '../util'
    import * as DIY from '../enums'
    import NumberInputBase from './number-input-base'

    export default {
        extends: NumberInputBase,
        methods:{
            updateSelf (newValue) {
                this.$emit('input', this.correctValue(newValue) * DIY.ToOriginalFromMeter);
                this.$forceUpdate();    // MEMO : if the corrected value is the same as this.value, the view isn't updated so force it to do so
            }
        },
        computed:{
            normalizedValue(){
                return Utils.round(this.value * DIY.ToMeter, 0);
            }
        }
    }
</script>

<style scoped lang="stylus">
    input
        text-align: right
</style>