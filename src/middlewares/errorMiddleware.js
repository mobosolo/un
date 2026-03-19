import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

const errorMiddleware = (err, req, res, next) => {
  console.error(err); // Affiche l'erreur complète dans la console du serveur

  let statusCode = 500;
  let message = 'Erreur interne du serveur.';
  let details = {};

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Gérer les erreurs connues de Prisma
    switch (err.code) {
      case 'P2002':
        statusCode = 409; // Conflit
        message = `Un conflit est survenu. Le champ '${err.meta.target.join(', ')}' doit être unique.`;
        details = { field: err.meta.target };
        break;
      case 'P2025':
        statusCode = 404; // Non trouvé
        message = "La ressource demandée n'a pas été trouvée.";
        break;
      // Ajoutez d'autres codes d'erreur Prisma ici si nécessaire
      default:
        statusCode = 400;
        message = 'Erreur de base de données inattendue.';
        details = { prismaCode: err.code };
        break;
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token JWT invalide ou malformé.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Votre session a expiré. Veuillez vous reconnecter.';
  } else if (err.message) {
    // Gérer les erreurs personnalisées que nous avons lancées
    // (par exemple, "Identifiants invalides.")
    // On peut définir un code de statut personnalisé sur l'erreur
    statusCode = err.statusCode || 400;
    message = err.message;
  }
  
  res.status(statusCode).json({
    message,
    ...(Object.keys(details).length > 0 && { details }), // N'ajoute les détails que s'ils existent
  });
};

export default errorMiddleware;
