<template lang="pug">
    input(:value="value" @input="updateSelf($event.target.value)" type="number")
</template>

<script>
    export default {
        props: {
            value:{ required:true },
            correctValue:{
                default:function(){return function(value){ return value; }; }
            }
        },
        methods:{
            updateSelf (newValue) {
                this.$emit('input', this.correctValue(newValue));
                this.$forceUpdate();    // MEMO : if the corrected value is the same as this.value, the view isn't updated so force it to do so
           }
        }
    }
</script>

<style scoped lang="stylus">
    input
        text-align: right
</style>