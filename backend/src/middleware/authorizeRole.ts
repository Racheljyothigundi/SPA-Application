

// authorizeRole.ts
export const authorizeRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires ${requiredRole} credentials.`
      });
    }
    next();
  };
};