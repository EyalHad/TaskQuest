import type { Quest } from "../types";

export async function checkAndNotify(quests: Quest[]) {
  if (localStorage.getItem("taskquest_notifications") !== "true") return;
  if (!("Notification" in window)) return;

  let permitted = Notification.permission === "granted";
  if (!permitted && Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    permitted = result === "granted";
  }
  if (!permitted) return;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = quests.filter(q => !q.completed && !q.failed && !q.isArchived && q.dueDate && q.dueDate.slice(0, 10) < today);
  const dueToday = quests.filter(q => !q.completed && !q.failed && !q.isArchived && q.dueDate?.slice(0, 10) === today);

  if (overdue.length > 0) {
    new Notification("TaskQuest", { body: `You have ${overdue.length} overdue quest${overdue.length > 1 ? "s" : ""}!` });
  } else if (dueToday.length > 0) {
    new Notification("TaskQuest", { body: `${dueToday.length} quest${dueToday.length > 1 ? "s" : ""} due today.` });
  }
}
