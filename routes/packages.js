import { Router } from "express";
import { 
  getPackages, 
  getPopularPackages, 
  createPackage, 
  updatePackage, 
  deletePackage, 
  getPackageById, 
  getAllPackages 
} from "../controllers/packageController.js";
import authenticateAdmin from "../middleware/authenticateAdmin.js";

const router = Router();

/**
 * @swagger
 * /api/packages:
 *   get:
 *     tags: [Packages]
 *     summary: Get all active packages
 *     description: Returns all active credit packages available for purchase
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Packages retrieved successfully"
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a1b2c3d4e5f6789012345"
 *                       name:
 *                         type: string
 *                         example: "Starter"
 *                       credits:
 *                         type: number
 *                         example: 25
 *                       price:
 *                         type: number
 *                         example: 4.99
 *                       bonus:
 *                         type: number
 *                         example: 5
 *                       totalCredits:
 *                         type: number
 *                         example: 30
 *                       pricePerCredit:
 *                         type: string
 *                         example: "0.1663"
 *                       bonusPercentage:
 *                         type: number
 *                         example: 20
 *                       description:
 *                         type: string
 *                         example: "Perfect for casual readers"
 *                       isPopular:
 *                         type: boolean
 *                         example: false
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       sortOrder:
 *                         type: number
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve packages"
 */
// Public endpoint - Get all active packages
router.get("/", getPackages);

/**
 * @swagger
 * /api/packages/popular:
 *   get:
 *     tags: [Packages]
 *     summary: Get popular packages
 *     description: Returns packages marked as popular
 *     responses:
 *       200:
 *         description: Popular packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Popular packages retrieved successfully"
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 */
// Public endpoint - Get popular packages
router.get("/popular", getPopularPackages);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     tags: [Packages]
 *     summary: Create a new package (Admin only)
 *     description: Creates a new credit package
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - credits
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium"
 *                 maxLength: 100
 *               credits:
 *                 type: number
 *                 example: 75
 *                 minimum: 1
 *                 maximum: 10000
 *               price:
 *                 type: number
 *                 example: 14.99
 *                 minimum: 0.01
 *                 maximum: 1000
 *               bonus:
 *                 type: number
 *                 example: 15
 *                 minimum: 0
 *                 maximum: 1000
 *               description:
 *                 type: string
 *                 example: "For dedicated story lovers"
 *                 maxLength: 500
 *               isPopular:
 *                 type: boolean
 *                 example: true
 *               sortOrder:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Package created successfully"
 *                 package:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized - admin access required
 *       409:
 *         description: Conflict - package name already exists
 *       500:
 *         description: Server error
 */
// Admin endpoint - Create new package
router.post("/", authenticateAdmin, createPackage);

/**
 * @swagger
 * /api/packages/{id}:
 *   patch:
 *     tags: [Packages]
 *     summary: Update a package (Admin only)
 *     description: Updates an existing credit package
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Plus"
 *               credits:
 *                 type: number
 *                 example: 100
 *               price:
 *                 type: number
 *                 example: 19.99
 *               bonus:
 *                 type: number
 *                 example: 25
 *               description:
 *                 type: string
 *                 example: "For dedicated story lovers"
 *               isPopular:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               sortOrder:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Package updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Package updated successfully"
 *                 package:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Package not found
 *       409:
 *         description: Conflict - package name already exists
 *       500:
 *         description: Server error
 */
// Admin endpoint - Update package
router.patch("/:id", authenticateAdmin, updatePackage);

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     tags: [Packages]
 *     summary: Delete a package (Admin only)
 *     description: Permanently deletes a credit package
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Package deleted successfully"
 *                 package:
 *                   type: object
 *       400:
 *         description: Bad request - invalid package ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
// Admin endpoint - Delete package
router.delete("/:id", authenticateAdmin, deletePackage);

/**
 * @swagger
 * /api/packages/admin:
 *   get:
 *     tags: [Packages]
 *     summary: Get all packages (Admin only)
 *     description: Retrieves all packages including inactive ones
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: All packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All packages retrieved successfully"
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - admin access required
 *       500:
 *         description: Server error
 */
// Admin endpoint - Get all packages (including inactive)
router.get("/admin", authenticateAdmin, getAllPackages);

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     tags: [Packages]
 *     summary: Get package by ID (Admin only)
 *     description: Retrieves a specific package by ID
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Package retrieved successfully"
 *                 package:
 *                   type: object
 *       400:
 *         description: Bad request - invalid package ID
 *       401:
 *         description: Unauthorized - admin access required
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
// Admin endpoint - Get package by ID
router.get("/:id", authenticateAdmin, getPackageById);

export default router;
