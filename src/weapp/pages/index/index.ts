import { definePage, ref } from '@vue-mini/core'

definePage({
  setup() {
    // Simple reactive state to validate vue-mini integration
    const count = ref(0)
    const inc = () => { count.value++ }
    return { count, inc }
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.();
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/index/index');
  },
})
