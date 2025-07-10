-- Session management autocmds
-- Save sessions on exit and restore them when opening Neovim in the same directory
local session_dir = vim.fn.expand("~/.local/state/nvim/sessions")
if vim.fn.isdirectory(session_dir) == 0 then
  vim.fn.mkdir(session_dir, "p")
end

local session_augroup = vim.api.nvim_create_augroup("SessionManagement", { clear = true })

local function get_project_name()
  local cwd = vim.fn.getcwd()
  return vim.fn.fnamemodify(cwd, ":t")
end

local function get_session_file()
  local project_name = get_project_name()
  return session_dir .. "/" .. project_name .. ".vim"
end

-- Debounced session saving
local save_timer = nil
local function debounced_save_session()
  if save_timer then
    vim.fn.timer_stop(save_timer)
  end
  save_timer = vim.fn.timer_start(1000, function()
    -- Only save if we have at least one normal buffer
    local has_normal_buffer = false
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
      if vim.api.nvim_buf_is_valid(buf) and vim.api.nvim_buf_is_loaded(buf) then
        local buftype = vim.api.nvim_buf_get_option(buf, "buftype")
        local filetype = vim.api.nvim_buf_get_option(buf, "filetype")
        if buftype == "" and filetype ~= "netrw" then
          has_normal_buffer = true
          break
        end
      end
    end

    if has_normal_buffer then
      local session_file = get_session_file()
      vim.cmd("mksession! " .. session_file)
    end
    save_timer = nil
  end)
end

local function augroup(name)
  return vim.api.nvim_create_augroup("custom_" .. name, { clear = true })
end

-- Save session when exiting Neovim
vim.api.nvim_create_autocmd("VimLeave", {
  group = session_augroup,
  callback = function()
    local session_file = get_session_file()
    vim.cmd("mksession! " .. session_file)
  end,
})

-- Restore session when entering Neovim
vim.api.nvim_create_autocmd("VimEnter", {
  group = session_augroup,
  nested = true,
  callback = function()
    if vim.fn.argc() == 0 then
      local session_file = get_session_file()
      if vim.fn.filereadable(session_file) == 1 then
        vim.cmd("silent! source " .. session_file)
      end
    end
  end,
})

-- Save session when buffers are added
vim.api.nvim_create_autocmd("BufAdd", {
  group = session_augroup,
  callback = function(args)
    local buftype = vim.api.nvim_buf_get_option(args.buf, "buftype")
    if buftype == "" then
      debounced_save_session()
    end
  end,
})

-- Save session when buffers are deleted
vim.api.nvim_create_autocmd("BufDelete", {
  group = session_augroup,
  callback = function()
    debounced_save_session()
  end,
})

-- Save session when buffers are written
vim.api.nvim_create_autocmd("BufWritePost", {
  group = session_augroup,
  callback = function(args)
    local buftype = vim.api.nvim_buf_get_option(args.buf, "buftype")
    if buftype == "" then
      debounced_save_session()
    end
  end,
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

-- go to last loc when opening a buffer
vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local exclude = { "gitcommit" }
    local buf = event.buf
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) or vim.b[buf].lazyvim_last_loc then
      return
    end
    vim.b[buf].lazyvim_last_loc = true
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
    vim.opt_local.wrap = true
    vim.opt_local.shiftwidth = 2
    vim.opt_local.tabstop = 2
    vim.opt_local.softtabstop = 2
  end,
})
