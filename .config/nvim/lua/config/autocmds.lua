-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua

-- Disable autoformat for files from work
vim.api.nvim_create_autocmd({ "FileType" }, {
  pattern = { "ruby", "eruby", "javascript", "toml" },
  callback = function()
    vim.b.autoformat = false
  end,
})

-- https://github.com/nvim-treesitter/nvim-treesitter/issues/2566
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "ruby" },
  command = "setlocal indentkeys-=.",
})

-- Logic for hiding diagnostics until hover

-- Create a namespace for diagnostic virtual text
local diagnostic_ns = vim.api.nvim_create_namespace("diagnostic_virt")

-- Diagnostic signs configuration
local signs = require("lazyvim.config").icons.diagnostics
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
end

-- Diagnostic utilities
local function best_diagnostic(diagnostics)
  if vim.tbl_isempty(diagnostics) then
    return
  end
  local best = nil
  local line_diagnostics = {}
  local line_nr = vim.api.nvim_win_get_cursor(0)[1] - 1

  for k, v in pairs(diagnostics) do
    if v.lnum == line_nr then
      line_diagnostics[k] = v
    end
  end

  for _, diagnostic in pairs(line_diagnostics) do
    if best == nil then
      best = diagnostic
    elseif diagnostic.severity < best.severity then
      best = diagnostic
    end
  end
  return best
end

local function current_line_diagnostics(bufnr)
  bufnr = bufnr or 0
  local line_nr = vim.api.nvim_win_get_cursor(0)[1] - 1
  return vim.diagnostic.get(bufnr, { ["lnum"] = line_nr })
end

-- Virtual text handler setup
local virt_handler = vim.diagnostic.handlers.virtual_text
local severity = vim.diagnostic.severity
local virt_options = {
  prefix = "",
  format = function(diagnostic)
    local message = vim.split(diagnostic.message, "\n")[1]

    if diagnostic.severity == severity.ERROR then
      return signs.Error .. " " .. message
    elseif diagnostic.severity == severity.INFO then
      return signs.Info .. " " .. message
    elseif diagnostic.severity == severity.WARN then
      return signs.Warn .. " " .. message
    elseif diagnostic.severity == severity.HINT then
      return signs.Hint .. " " .. message
    else
      return message
    end
  end,
}

-- Custom diagnostic handler
vim.diagnostic.handlers.current_line_virt = {
  show = function(_, bufnr, diagnostics, opts)
    -- Always clear existing virtual text first
    virt_handler.hide(diagnostic_ns, bufnr)

    local diagnostic = best_diagnostic(diagnostics)
    if not diagnostic then
      return
    end

    local complete_opts = vim.tbl_extend("force", {
      virtual_text = virt_options,
      float = { source = "always" },
      signs = true,
      underline = true,
      update_in_insert = false,
    }, opts or {})

    pcall(
      virt_handler.show,
      diagnostic_ns,
      bufnr or 0, -- Ensure bufnr is never nil
      { diagnostic },
      complete_opts
    )
  end,

  hide = function(_, bufnr)
    bufnr = bufnr or vim.api.nvim_get_current_buf()
    virt_handler.hide(diagnostic_ns, bufnr)
  end,
}

-- Global diagnostic configuration
vim.diagnostic.config({
  float = { source = true },
  signs = true,
  virtual_text = false,
  severity_sort = true,
  current_line_virt = true,
  update_in_insert = false,
})

-- Setup diagnostic autocommands for each buffer
local function setup_diagnostic_autocmds(bufnr)
  local group_name = "lsp_diagnostic_buffer_" .. tostring(bufnr)
  local group = vim.api.nvim_create_augroup(group_name, { clear = true })

  -- Show diagnostic on cursor hold
  vim.api.nvim_create_autocmd("CursorHold", {
    group = group,
    buffer = bufnr,
    callback = function()
      vim.diagnostic.handlers.current_line_virt.show(0, bufnr, current_line_diagnostics(bufnr), nil)
    end,
  })

  -- Hide diagnostic on cursor move or insert mode exit
  vim.api.nvim_create_autocmd({ "CursorMoved", "InsertLeave" }, {
    group = group,
    buffer = bufnr,
    callback = function()
      vim.diagnostic.handlers.current_line_virt.hide(0, bufnr)
    end,
  })

  -- Clean up when buffer is detached
  vim.api.nvim_create_autocmd("BufDelete", {
    group = group,
    buffer = bufnr,
    callback = function()
      vim.diagnostic.handlers.current_line_virt.hide(0, bufnr)
      vim.api.nvim_del_augroup_by_name(group_name)
    end,
  })
end

-- LSP Attach configuration
vim.api.nvim_create_autocmd("LspAttach", {
  group = vim.api.nvim_create_augroup("lsp-attach", { clear = true }),
  callback = function(event)
    -- Set up diagnostic handlers for this buffer
    setup_diagnostic_autocmds(event.buf)
  end,
})
