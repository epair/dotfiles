require "nvchad.mappings"

-- add yours here
local map = vim.keymap.set

map("n", ";", ":")
map("i", "jk", "<ESC>")
map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")

-- Terminal exit navigation mappings
map("t", "<C-h>", "<C-\\><C-n><C-w>h")
map("t", "<C-j>", "<C-\\><C-n><C-w>j")
map("t", "<C-k>", "<C-\\><C-n><C-w>k")
map("t", "<C-l>", "<C-\\><C-n><C-w>l")

-- Gitsigns mappings
require('gitsigns').setup{
  on_attach = function()
    local gitsigns = require('gitsigns')

    -- Navigation
    map('n', ']c', function()
      if vim.wo.diff then
        vim.cmd.normal({']c', bang = true})
      else
        gitsigns.nav_hunk('next')
      end
    end, { desc = "Git next hunk" })

    map('n', '[c', function()
      if vim.wo.diff then
        vim.cmd.normal({'[c', bang = true})
      else
        gitsigns.nav_hunk('prev')
      end
    end, { desc = "Git last hunk" })

    -- Actions
    map('n', '<leader>hs', gitsigns.stage_hunk, { desc = "Git stage hunk" })
    map('n', '<leader>hr', gitsigns.reset_hunk, { desc = "Git reset hunk"} )
    map('v', '<leader>hs', function() gitsigns.stage_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = "Git stage hunk" })
    map('v', '<leader>hr', function() gitsigns.reset_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = "Git reset hunk" })
    map('n', '<leader>hS', gitsigns.stage_buffer, { desc = "Git stage buffer" })
    map('n', '<leader>hu', gitsigns.undo_stage_hunk, { desc = "Git undo stage hunk" })
    map('n', '<leader>hR', gitsigns.reset_buffer, { desc = "Git reset buffer" })
    map('n', '<leader>hp', gitsigns.preview_hunk, { desc = "Git preview hunk" })
    map('n', '<leader>hb', function() gitsigns.blame_line{full=true} end, { desc = "Git blame hunk" })
    map('n', '<leader>tb', gitsigns.toggle_current_line_blame, { desc = "Git blame line" })
    map('n', '<leader>hd', gitsigns.diffthis, { desc = "Git diff hunk" })
    map('n', '<leader>hD', function() gitsigns.diffthis('~') end, { desc = "Git diff" })
    map('n', '<leader>td', gitsigns.toggle_deleted, { desc = "Git toggle deleted hunk" })

    -- Text object
    map({'o', 'x'}, 'ih', ':<C-U>Gitsigns select_hunk<CR>')
  end
}

