Page({
  data: {
    message: "Hello, Dreamer!",
    subtitle: 'Grow imagination • Learn • Play',
  },

  onClick() {
    wx.showToast({ title: 'Let\'s Start!', icon: 'success' })
  },

  onSecondary() {
    wx.showToast({ title: 'Coming soon', icon: 'none' })
  },
})
