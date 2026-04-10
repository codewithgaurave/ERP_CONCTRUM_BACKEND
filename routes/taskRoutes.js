import express from "express";
import {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  reviewTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getAssignableEmployees,
  getDeadlineAlerts,
  getTaskById,
  restoreTask,
  submitTaskResponse,
  reviewTaskResponse,
  createSubTasks,
  getTaskResponses
} from "../controllers/taskController.js";

import {
  authenticateToken,
  requireTeamLeader,
  requireRole
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a task (HR Manager or Team Leader)
router.post("/", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), createTask);

// Get all tasks (HR Manager or Team Leader)
router.get("/", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), getAllTasks);

// Get my tasks (Employee)
router.get("/my", authenticateToken, getMyTasks);


// Get task statistics
router.get("/stats", authenticateToken, getTaskStats);

// Get assignable employees
router.get("/assignable-employees", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), getAssignableEmployees);

// Get deadline alerts
router.get("/alerts/deadline", authenticateToken, getDeadlineAlerts);

// Get task by ID
router.get("/:id", authenticateToken, getTaskById);

// Submit task response (Employee)
router.post("/:taskId/responses", authenticateToken, submitTaskResponse);

// Review task response (HR Manager/Team Leader)
router.put("/:taskId/responses/:responseId/review", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), reviewTaskResponse);

// Create sub-tasks (Team Leader)
router.post("/:taskId/sub-tasks", authenticateToken, requireRole(['Team_Leader']), createSubTasks);

// Get task responses with analytics
router.get("/:taskId/responses", authenticateToken, getTaskResponses);

// Update task status (Employee - Only for assigned tasks)
router.put("/:id/status", authenticateToken, updateTaskStatus);

// Approve/Reject task (HR Manager/Team Leader - Only for completed tasks)
router.put("/:id/review", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), reviewTask);

// Update task details (HR Manager/Team Leader)
router.put("/:id", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), updateTask);

// Soft delete (HR Manager / Team Leader)
router.delete("/:id", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), deleteTask);
router.patch("/:id", authenticateToken, requireRole(['HR_Manager', 'Team_Leader']), restoreTask);

export default router;