return {
  'nat-418/boole.nvim',
  version = '*',
  config = function ()
    require('boole').setup({
      mappings = {
        increment = '<C-a>',
        decrement = '<C-x>'
      },
    })
  end
}
