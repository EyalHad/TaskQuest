import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { getCategoryColor, getSkillProgress } from "../../lib/skill-tree";
import { EmojiPicker } from "../shared/EmojiPicker";
import { OverflowMenu, type OverflowMenuItem } from "../shared/OverflowMenu";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import {
  X,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Archive,
  RotateCcw,
  Trash2,
  Pencil,
  BookOpen,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { SkillNode } from "../../types";

const catColors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  blue: { bg: "bg-electric-blue/5", border: "border-electric-blue/20", text: "text-electric-blue", bar: "bg-electric-blue" },
  amber: { bg: "bg-gold/5", border: "border-gold/20", text: "text-gold", bar: "bg-gold" },
  emerald: { bg: "bg-emerald-glow/5", border: "border-emerald-glow/20", text: "text-emerald-glow", bar: "bg-emerald-glow" },
  red: { bg: "bg-crimson/5", border: "border-crimson/20", text: "text-crimson", bar: "bg-crimson" },
  slate: { bg: "bg-card", border: "border-default", text: "text-secondary", bar: "bg-muted" },
};

const COLOR_KEYS = ["blue", "amber", "emerald", "red", "slate"] as const;

const CATEGORY_COLORS = [
  { key: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
  { key: "amber", bg: "bg-amber-500", ring: "ring-amber-400" },
  { key: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { key: "red", bg: "bg-red-500", ring: "ring-red-400" },
  { key: "slate", bg: "bg-muted", ring: "ring-muted" },
] as const;

function getResolvedColor(category: string): string {
  try {
    const custom = JSON.parse(localStorage.getItem("taskquest_custom_colors") || "{}");
    if (custom[category]) return custom[category];
  } catch {}
  return getCategoryColor(category);
}

function filterTree(nodes: SkillNode[], search: string): SkillNode[] {
  if (!search.trim()) return nodes;
  const q = search.trim().toLowerCase();

  function matches(node: SkillNode): boolean {
    return node.name.toLowerCase().includes(q);
  }

  function hasMatchingDescendant(node: SkillNode): boolean {
    if (matches(node)) return true;
    return node.children.some((c) => hasMatchingDescendant(c));
  }

  function filterNode(node: SkillNode): SkillNode | null {
    if (!hasMatchingDescendant(node)) return null;
    const filteredChildren = node.children
      .map((c) => filterNode(c))
      .filter((c): c is SkillNode => c !== null);
    return { ...node, children: filteredChildren };
  }

  return nodes.map((n) => filterNode(n)).filter((n): n is SkillNode => n !== null);
}

function collectLeafIds(node: SkillNode): number[] {
  if (node.children.length === 0) return [node.id];
  return node.children.flatMap((c) => collectLeafIds(c));
}

function findNodeInTree(nodes: SkillNode[], id: number): SkillNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

export function SkillBank() {
  const skillTree = useStore((s) => s.skillTree);
  const quests = useStore((s) => s.quests);
  const createSkill = useStore((s) => s.createSkill);
  const loadSkills = useStore((s) => s.loadSkills);
  const deleteSkill = useStore((s) => s.deleteSkill);
  const updateSkill = useStore((s) => s.updateSkill);
  const moveSkill = useStore((s) => s.moveSkill);
  const archiveSkill = useStore((s) => s.archiveSkill);
  const unarchiveSkill = useStore((s) => s.unarchiveSkill);
  const loadArchivedSkills = useStore((s) => s.loadArchivedSkills);
  const archivedSkills = useStore((s) => s.archivedSkills);
  const reorderSkills = useStore((s) => s.reorderSkills);
  const skillQuestCounts = useStore((s) => s.skillQuestCounts);
  const skillBankOpen = useStore((s) => s.skillBankOpen);
  const closeSkillBank = useStore((s) => s.closeSkillBank);
  const loading = useStore((s) => s.loading);
  const setPage = useStore((s) => s.setPage);

  const [search, setSearch] = useState("");
  const [addingTo, setAddingTo] = useState<{ parentId: number | null; category: string; depth: number } | null>(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("⭐");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmDeleteArchived, setConfirmDeleteArchived] = useState<number | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📁");
  const [catColor, setCatColor] = useState<typeof COLOR_KEYS[number]>("blue");
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const filteredTree = filterTree(skillTree, search);

  useEffect(() => {
    if (archiveOpen) loadArchivedSkills();
  }, [archiveOpen, loadArchivedSkills]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  const handleBrowseCatalog = () => {
    closeSkillBank();
    setPage("catalog");
  };

  const handleAdd = async () => {
    if (!newName.trim() || !addingTo) return;
    await createSkill({
      name: newName.trim(),
      category: addingTo.category,
      parentSkillId: addingTo.parentId,
      icon: newIcon || undefined,
    });
    setNewName("");
    setNewIcon("");
    setAddingTo(null);
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    const code = catName.trim().slice(0, 4).toUpperCase() || "CAT";
    await createSkill({
      name: catName.trim(),
      category: code,
      parentSkillId: null,
      icon: catIcon || "📁",
    });
    const existing = JSON.parse(localStorage.getItem("taskquest_custom_colors") || "{}");
    existing[code] = catColor;
    localStorage.setItem("taskquest_custom_colors", JSON.stringify(existing));
    setCatName("");
    setCatIcon("📁");
    setCatColor("blue");
    setAddCategoryOpen(false);
    await loadSkills();
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateSkill(editingId, { name: editName.trim(), icon: editIcon || "⭐" });
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  };

  const handleDelete = async (skillId: number) => {
    await deleteSkill(skillId);
    setConfirmDelete(null);
  };

  const handleDragStart = (e: React.DragEvent, skillId: number) => {
    setDragId(skillId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(skillId));
  };

  const handleDragOver = (e: React.DragEvent, skillId: number) => {
    e.preventDefault();
    if (dragId !== skillId) setDragOverId(skillId);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (e: React.DragEvent, group: SkillNode) => {
    e.preventDefault();
    setDragId(null);
    setDragOverId(null);
    const draggedId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!draggedId || isNaN(draggedId) || draggedId === group.id) return;
    const sorted = [...group.children].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((s) => s.id === draggedId);
    if (idx === -1) return;
    const newOrder = sorted.map((s) => s.id);
    const [removed] = newOrder.splice(idx, 1);
    const dropIdx = sorted.findIndex((s) => s.id === dragOverId);
    const insertAt = dropIdx >= 0 ? dropIdx : newOrder.length;
    newOrder.splice(insertAt, 0, removed);
    reorderSkills(newOrder);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  if (!skillBankOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={closeSkillBank}
      role="dialog"
      aria-modal="true"
      aria-label="Skill bank"
    >
      <div
        className={cn(
          "bg-panel border border-subtle rounded-2xl shadow-2xl flex flex-col",
          "w-full sm:max-w-2xl lg:max-w-3xl sm:mx-4 h-full sm:h-auto sm:max-h-[85vh] animate-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-default flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-primary">Skill Bank</h2>
          <button
            onClick={closeSkillBank}
            className="text-muted hover:text-secondary transition-colors p-1 rounded-lg hover:bg-card-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-default shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-9 pr-3 py-2 bg-card border border-default rounded-lg text-primary placeholder-muted text-sm focus:outline-none focus:border-electric-blue/50"
            />
          </div>
          <button
            onClick={handleBrowseCatalog}
            className="mt-2 text-xs text-electric-blue hover:text-electric-blue/80 flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Browse Catalog
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredTree.length === 0 && !addCategoryOpen ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-secondary mb-4">
                {search ? "No skills match your search." : "No skills yet. Add categories or browse the catalog."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBrowseCatalog}
                  className="px-4 py-2 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 rounded-lg text-sm font-medium transition-colors border border-electric-blue/20"
                >
                  Browse Catalog
                </button>
                <button
                  onClick={() => setAddCategoryOpen(true)}
                  className="px-4 py-2 bg-default text-primary hover:bg-card-hover rounded-lg text-sm font-medium transition-colors"
                >
                  + Create Category
                </button>
              </div>
            </div>
          ) : (
            filteredTree.map((category) => {
              const colorKey = getResolvedColor(category.category);
              const colors = catColors[colorKey] ?? catColors.slate;

              return (
                <div
                  key={category.id}
                  className={cn("rounded-xl border p-3", colors.border, colors.bg)}
                >
                  <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("font-semibold text-sm flex items-center gap-2", colors.text)}>
                      {category.icon} {category.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setAddingTo({ parentId: category.id, category: category.category, depth: 1 })
                        }
                        className="text-xs text-muted hover:text-electric-blue flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-card-hover"
                        title="Add group"
                      >
                        <Plus className="w-3 h-3" /> Group
                      </button>
                      <OverflowMenu
                        items={[
                          {
                            label: "Archive",
                            icon: <Archive className="w-4 h-4" />,
                            onClick: () => archiveSkill(category.id),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => setConfirmDelete(category.id),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  {addingTo?.parentId === category.id && addingTo.depth === 1 && (
                    <div className="ml-4 mb-3 p-3 bg-card/50 rounded-lg border border-subtle flex flex-wrap items-center gap-2">
                      <EmojiPicker value={newIcon} onChange={setNewIcon} />
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Group name..."
                        autoFocus
                        className="flex-1 min-w-[120px] bg-card border border-default rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
                      />
                      <button
                        onClick={handleAdd}
                        disabled={loading || !newName.trim()}
                        className="px-3 py-1.5 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 text-sm font-medium rounded-lg transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="px-2 text-sm text-muted hover:text-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {category.children
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((group) => (
                      <div key={group.id} className="ml-4 mb-3">
                        <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
                            {group.icon} {group.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setAddingTo({ parentId: group.id, category: category.category, depth: 2 })
                              }
                              className="text-xs text-muted hover:text-electric-blue flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-card-hover"
                              title="Add skill"
                            >
                              <Plus className="w-3 h-3" /> Skill
                            </button>
                            <OverflowMenu
                              items={[
                                {
                                  label: "Archive",
                                  icon: <Archive className="w-4 h-4" />,
                                  onClick: () => archiveSkill(group.id),
                                },
                                {
                                  label: "Delete",
                                  icon: <Trash2 className="w-4 h-4" />,
                                  danger: true,
                                  onClick: () => setConfirmDelete(group.id),
                                },
                              ]}
                            />
                          </div>
                        </div>

                        {addingTo?.parentId === group.id && addingTo.depth === 2 && (
                          <div className="ml-4 mb-2 p-3 bg-card/50 rounded-lg border border-subtle flex flex-wrap items-center gap-2">
                            <EmojiPicker value={newIcon} onChange={setNewIcon} />
                            <input
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Skill name..."
                              autoFocus
                              className="flex-1 min-w-[120px] bg-card border border-default rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
                            />
                            <button
                              onClick={handleAdd}
                              disabled={loading || !newName.trim()}
                              className="px-3 py-1.5 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 text-sm font-medium rounded-lg transition-colors"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setAddingTo(null)}
                              className="px-2 text-sm text-muted hover:text-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        <div className="ml-4 space-y-0.5">
                          {group.children
                            .slice()
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((skill) => (
                              <div key={skill.id}>
                                {editingId === skill.id ? (
                                  <div className="flex items-center gap-2 py-1.5 px-2 bg-card/50 rounded-lg">
                                    <EmojiPicker value={editIcon} onChange={setEditIcon} />
                                    <input
                                      ref={editInputRef}
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit();
                                        if (e.key === "Escape") setEditingId(null);
                                      }}
                                      className="flex-1 bg-card border border-default rounded px-2 py-1 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
                                    />
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-2 py-1 text-xs text-electric-blue hover:bg-electric-blue/10 rounded"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="px-2 py-1 text-xs text-muted hover:text-secondary"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <LeafSkillRow
                                    skill={skill}
                                    colors={colors}
                                    skillQuestCounts={skillQuestCounts}
                                    isDragging={dragId === skill.id}
                                    isDragOver={dragOverId === skill.id}
                                    onDoubleClick={() => {
                                      setEditingId(skill.id);
                                      setEditName(skill.name);
                                      setEditIcon(skill.icon || "⭐");
                                    }}
                                    onEditClick={() => {
                                      setEditingId(skill.id);
                                      setEditName(skill.name);
                                      setEditIcon(skill.icon || "⭐");
                                    }}
                                    onDeleteClick={() => setConfirmDelete(skill.id)}
                                    onArchiveClick={() => archiveSkill(skill.id)}
                                    onMoveTo={(targetGroupId, targetCategory) => moveSkill(skill.id, targetGroupId, targetCategory)}
                                    allGroupsWithCategory={skillTree.flatMap((cat) =>
                                      cat.children.map((g) => ({ cat, group: g }))
                                    )}
                                    onDragStart={(e) => handleDragStart(e, skill.id)}
                                    onDragOver={(e) => handleDragOver(e, skill.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, group)}
                                    onDragEnd={handleDragEnd}
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                        </>
                      </div>
                    ))}
                  </>
                </div>
              );
            })
          )}

          {/* Add Category */}
          <div className="pt-2">
            {addCategoryOpen ? (
              <div className="p-4 bg-card/50 rounded-xl border border-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <EmojiPicker value={catIcon} onChange={setCatIcon} />
                  <input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Category name..."
                    autoFocus
                    className="flex-1 bg-card border border-default rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-electric-blue/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Color:</span>
                  <div className="flex gap-2">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCatColor(c.key)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          c.bg,
                          catColor === c.key && `ring-2 ${c.ring} ring-offset-2 ring-offset-panel`
                        )}
                        title={c.key}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCategory}
                    disabled={loading || !catName.trim()}
                    className="px-4 py-2 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 disabled:opacity-40 text-sm font-medium rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setAddCategoryOpen(false)}
                    className="px-3 text-sm text-muted hover:text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddCategoryOpen(true)}
                className="w-full py-2 border border-dashed border-subtle rounded-xl text-muted hover:text-secondary hover:border-secondary text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>

          {/* Archived */}
          <div className="pt-4 border-t border-default">
            <button
              onClick={() => setArchiveOpen(!archiveOpen)}
              className="w-full flex items-center justify-between py-2 text-muted hover:text-secondary transition-colors"
            >
              <span className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archived ({archivedSkills.length})
              </span>
              {archiveOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {archiveOpen && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {archivedSkills.length === 0 ? (
                  <p className="text-xs text-muted py-2">No archived skills.</p>
                ) : (
                  archivedSkills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 px-3 bg-card/50 rounded-lg"
                    >
                      <span className="text-sm text-secondary">
                        {s.icon} {s.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => unarchiveSkill(s.id)}
                          className="p-1.5 text-muted hover:text-electric-blue rounded transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteArchived(s.id)}
                          className="p-1.5 text-muted hover:text-crimson rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete !== null && (() => {
        const node = findNodeInTree(skillTree, confirmDelete);
        if (!node) return null;
        const leafIds = collectLeafIds(node);
        const skillCount = leafIds.length;
        const questCount = quests.filter((q) => leafIds.includes(q.skillId)).length;
        const message = `This will remove ${skillCount} skill${skillCount !== 1 ? "s" : ""}${questCount > 0 ? ` and ${questCount} quest${questCount !== 1 ? "s" : ""}` : ""}. This cannot be undone.`;
        return (
          <ConfirmDialog
            open={true}
            title={`Delete "${node.name}"?`}
            message={message}
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        );
      })()}

      {confirmDeleteArchived !== null && (() => {
        const skill = archivedSkills.find((s) => s.id === confirmDeleteArchived);
        if (!skill) return null;
        return (
          <ConfirmDialog
            open={true}
            title="Delete Skill"
            message={`Are you sure you want to permanently delete "${skill.name}"? This cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => { deleteSkill(confirmDeleteArchived); setConfirmDeleteArchived(null); }}
            onCancel={() => setConfirmDeleteArchived(null)}
          />
        );
      })()}
    </div>
  );
}

function LeafSkillRow({
  skill,
  colors,
  skillQuestCounts,
  isDragging,
  isDragOver,
  onDoubleClick,
  onEditClick,
  onDeleteClick,
  onArchiveClick,
  onMoveTo,
  allGroupsWithCategory,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  skill: SkillNode;
  colors: (typeof catColors)[keyof typeof catColors];
  skillQuestCounts: Record<number, number>;
  isDragging: boolean;
  isDragOver: boolean;
  onDoubleClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onArchiveClick: () => void;
  onMoveTo: (groupId: number, category: string) => void;
  allGroupsWithCategory: Array<{ cat: SkillNode; group: SkillNode }>;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const progress = getSkillProgress(skill);
  const questCount = skillQuestCounts[skill.id] ?? 0;

  const menuItems: OverflowMenuItem[] = [
    ...(allGroupsWithCategory.length > 0
      ? [
          {
            label: "Move to...",
            submenu: allGroupsWithCategory.map(({ cat, group }) => ({
              label: (
                <span className={cn(group.id === skill.parentSkillId && "opacity-30")}>
                  {cat.icon} {cat.name} → {group.icon} {group.name}
                </span>
              ),
              onClick: () => onMoveTo(group.id, cat.category),
              disabled: group.id === skill.parentSkillId,
            })),
          },
        ]
      : []),
    { label: "Archive", icon: <Archive className="w-4 h-4" />, onClick: onArchiveClick },
    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, danger: true, onClick: onDeleteClick },
  ];

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-lg group transition-colors",
        isDragOver && "bg-card/50",
        isDragging && "opacity-50"
      )}
      onDragOver={(e) => onDragOver(e)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e)}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing text-muted hover:text-secondary touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div
        className="flex-1 min-w-0"
        onDoubleClick={onDoubleClick}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-secondary truncate">
            {skill.icon} {skill.name}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {questCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-default text-secondary">
                {questCount} quest{questCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-xs text-muted">
              {progress.progress}/{progress.needed} XP
            </span>
          </div>
        </div>
        <div className="mt-0.5 h-1 bg-card rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", colors.bar)}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEditClick}
          className="p-1 text-muted hover:text-electric-blue rounded transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <OverflowMenu items={menuItems} />
      </div>
    </div>
  );
}
