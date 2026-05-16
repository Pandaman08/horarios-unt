INSERT INTO Usuario (codigo, nombres, apellidos, correo_electronico, contrasena_hash, rol) VALUES
('ADMIN001', 'Admin', 'Sistema', 'admin@unitru.edu.pe', '$2b$10$nembnQjC2hsj0anexhNXS.6aWq.gaMAcntp0x9qwkkHmkLu.phTq2', 'administrador_sistema');

INSERT INTO Docente (id_usuario, codigo_docente, nombres, apellidos, modalidad, categoria, antiguedad) VALUES
(1, 'DOC001', 'Juan', 'Pérez', 'nombrado', 'principal', 15);