require "nvchad.mappings"

-- add yours here
local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")

-- map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")

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
    end, { desc = "Next hunk" })

    map('n', '[c', function()
      if vim.wo.diff then
        vim.cmd.normal({'[c', bang = true})
      else
        gitsigns.nav_hunk('prev')
      end
    end, { desc = "Last hunk" })

    -- Actions
    map('n', '<leader>hs', gitsigns.stage_hunk, { desc = "Stage current hunk" })
    map('n', '<leader>hr', gitsigns.reset_hunk, { desc = "Reset current hunk"} )
    map('v', '<leader>hs', function() gitsigns.stage_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = "Stage current hunk" })
    map('v', '<leader>hr', function() gitsigns.reset_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = "Reset current hunk" })
    map('n', '<leader>hS', gitsigns.stage_buffer, { desc = "Stage current buffer" })
    map('n', '<leader>hu', gitsigns.undo_stage_hunk, { desc = "Undo stage hunk" })
    map('n', '<leader>hR', gitsigns.reset_buffer, { desc = "Reset current buffer" })
    map('n', '<leader>hp', gitsigns.preview_hunk, { desc = "Preview hunk" })
    map('n', '<leader>hb', function() gitsigns.blame_line{full=true} end, { desc = "Git blame hunk" })
    map('n', '<leader>tb', gitsigns.toggle_current_line_blame, { desc = "Git blame line" })
    map('n', '<leader>hd', gitsigns.diffthis, { desc = "Git diff hunk" })
    map('n', '<leader>hD', function() gitsigns.diffthis('~') end, { desc = "Git diff" })
    map('n', '<leader>td', gitsigns.toggle_deleted, { desc = "Toggle deleted hunk" })

    -- Text object
    map({'o', 'x'}, 'ih', ':<C-U>Gitsigns select_hunk<CR>', { desc = "Text object select hunk" })
  end
}

