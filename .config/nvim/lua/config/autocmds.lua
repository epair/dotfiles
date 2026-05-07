local function augroup(name)
  return vim.api.nvim_create_augroup("custom_" .. name, { clear = true })
end

-- Save sessions on exit and restore them when opening Neovim in the same directory
local session_dir = vim.fn.expand("~/.local/state/nvim/sessions")
if vim.fn.isdirectory(session_dir) == 0 then
  vim.fn.mkdir(session_dir, "p")
end

local function get_session_file()
  return session_dir .. "/" .. vim.fn.fnamemodify(vim.fn.getcwd(), ":t") .. ".vim"
end

local save_timer = nil
local function debounced_save_session()
  if save_timer then
    vim.fn.timer_stop(save_timer)
  end
  save_timer = vim.fn.timer_start(1000, function()
    local has_normal_buffer = false
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
      if vim.api.nvim_buf_is_valid(buf) and vim.api.nvim_buf_is_loaded(buf)
        and vim.bo[buf].buftype == "" and vim.bo[buf].filetype ~= "netrw" then
        has_normal_buffer = true
        break
      end
    end

    if has_normal_buffer then
      vim.cmd("mksession! " .. get_session_file())
    end
    save_timer = nil
  end)
end

local session_group = augroup("session")

vim.api.nvim_create_autocmd("VimLeave", {
  group = session_group,
  callback = function()
    vim.cmd("mksession! " .. get_session_file())
  end,
})

vim.api.nvim_create_autocmd("VimEnter", {
  group = session_group,
  nested = true,
  callback = function()
    if vim.fn.argc() == 0 then
      local session_file = get_session_file()
      if vim.fn.filereadable(session_file) == 1 then
        vim.cmd("silent! source " .. session_file)
        -- Session loading suppresses BufRead autocmds, so treesitter
        -- highlighting doesn't attach to the restored buffer.
        vim.cmd("silent! edit")
      end
    end
  end,
})

vim.api.nvim_create_autocmd("BufAdd", {
  group = session_group,
  callback = function(args)
    if vim.bo[args.buf].buftype == "" then
      debounced_save_session()
    end
  end,
})

vim.api.nvim_create_autocmd("BufDelete", {
  group = session_group,
  callback = debounced_save_session,
})

-- https://github.com/nvim-treesitter/nvim-treesitter/issues/2566
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("ruby"),
  pattern = { "ruby" },
  command = "setlocal indentkeys-=.",
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    (vim.hl or vim.highlight).on_yank()
  end,
})

-- resize splits if window got resized
vim.api.nvim_create_autocmd({ "VimResized" }, {
  group = augroup("resize_splits"),
  callback = function()
    local current_tab = vim.fn.tabpagenr()
    vim.cmd("tabdo wincmd =")
    vim.cmd("tabnext " .. current_tab)
  end,
})

vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local buf = event.buf
    if vim.bo[buf].filetype == "gitcommit" or vim.b[buf].last_loc_set then
      return
    end
    vim.b[buf].last_loc_set = true
    local mark = vim.api.nvim_buf_get_mark(buf, '"')
    local lcount = vim.api.nvim_buf_line_count(buf)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Auto create dir when saving a file, in case some intermediate directory does not exist
vim.api.nvim_create_autocmd({ "BufWritePre" }, {
  group = augroup("auto_create_dir"),
  callback = function(event)
    if event.match:match("^%w%w+:[\\/][\\/]") then
      return
    end
    local file = vim.uv.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- Fix conceallevel for json files
vim.api.nvim_create_autocmd({ "FileType" }, {
  group = augroup("json_conceal"),
  pattern = { "json", "jsonc", "json5" },
  callback = function()
    vim.opt_local.conceallevel = 0
  end,
})

-- Enable line wrapping for markdown files and set 2-space indentation
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("markdown_wrap"),
  pattern = { "markdown" },
  callback = function()
    vim.schedule(function()
      vim.opt_local.wrap = true
      vim.opt_local.linebreak = true
      vim.opt_local.shiftwidth = 2
      vim.opt_local.tabstop = 2
      vim.opt_local.softtabstop = 2
    end)
  end,
})
