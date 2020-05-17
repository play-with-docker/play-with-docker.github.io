$(()=>{
  $(".dark-mode").click(()=>{
    $(document.body).toggleClass("dark-mode");
    const isDark = $(document.body).hasClass("dark-mode");
    ga('send', 'event', 'Nav', 'dark', isDark ? "enabled": "disabled");
  })
})
