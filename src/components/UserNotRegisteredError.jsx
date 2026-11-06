import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-card to-background">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mb-8 text-muted-foreground">
            No tienes acceso a esta aplicación. Contacta con el administrador para solicitar permiso.
          </p>
          <div className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
            <p>Si crees que es un error, puedes:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Comprobar que has iniciado sesión con la cuenta correcta</li>
              <li>Contactar con el administrador de la aplicación</li>
              <li>Cerrar sesión y volver a entrar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;