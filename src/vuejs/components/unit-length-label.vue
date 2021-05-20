<template lang="pug">
    span {{ normalizedValue }}
</template>

<script>
    import * as DIY from '../enums'
    const formatter = new Intl.NumberFormat();
    export default {
        props:['value'],
        computed:{
            normalizedValue(){
                return formatter.format(this.value * DIY.ToMeter);
            }
        }
    }
</script>

<style scoped lang="stylus">
    input
        text-align: right
</style>