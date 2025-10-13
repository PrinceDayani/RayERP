import { Router } from "express"

const router = Router()

router.get("/", (req, res) => res.send("Get all users"))
router.get("/:id", (req, res) => res.send(`Get user ${req.params.id}`))
router.post("/", (req, res) => res.send("Create user"))
router.put("/:id", (req, res) => res.send(`Update user ${req.params.id}`))
router.delete("/:id", (req, res) => res.send(`Delete user ${req.params.id}`))

export default router
