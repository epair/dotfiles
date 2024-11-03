return {
  'Mofiqul/dracula.nvim',
  lazy = false,
  priority = 1000,
  opts = {},
  config = function(_, opts)
    require('dracula').setup(opts)
  end,
}
-- vim: ts=2 sts=2 sw=2 et
