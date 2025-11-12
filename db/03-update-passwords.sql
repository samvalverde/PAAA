-- Actualiza contraseñas dummy "changeme" por hashes bcrypt válidos (contraseña real = changeme)
UPDATE users
SET password_hash = '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G'
WHERE password_hash = 'changeme';
