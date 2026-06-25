CREATE OR ALTER PROCEDURE [dbo].[sp_ConsultaBien]
(
    @Accion CHAR(1),

    @IdBien INT = NULL,
    @CodigoInventario VARCHAR(50) = NULL,
    @CodigoPatrimonial VARCHAR(50) = NULL,
    @NumeroSerie VARCHAR(100) = NULL,
    @Descripcion VARCHAR(255) = NULL,
    @IdArea INT = NULL,
    @IdEstadoBien INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- LISTAR ACTIVOS
    IF @Accion = 'L'
    BEGIN
        SELECT
            b.*,
            cat.CategoriaBien AS Categoria_CategoriaBien,
            cat.Activo AS Categoria_Activo,
            m.Marca AS Marca_Marca,
            m.Activo AS Marca_Activo,
            mo.Modelo AS Modelo_Modelo,
            mo.Activo AS Modelo_Activo,
            mo.IdMarca AS Modelo_IdMarca,
            mo.IdCategoria AS Modelo_IdCategoria,
            a.NombreArea AS Area_NombreArea,
            a.Piso AS Area_Piso,
            a.Referencia AS Area_Referencia,
            a.Activo AS Area_Activo,
            c.Condicion AS Condicion_Condicion,
            c.Activo AS Condicion_Activo,
            e.EstadoBien AS Estado_EstadoBien,
            e.Activo AS Estado_Activo
        FROM Bienes b
        LEFT JOIN CategoriasBienes cat ON b.IdCategoria = cat.IdCategoria
        LEFT JOIN Marcas m ON b.IdMarca = m.IdMarca
        LEFT JOIN Modelos mo ON b.IdModelo = mo.IdModelo
        LEFT JOIN Areas a ON b.IdArea = a.IdArea
        LEFT JOIN CondicionesBien c ON b.IdCondicion = c.IdCondicion
        LEFT JOIN EstadosDelBien e ON b.IdEstadoBien = e.IdEstadoBien
        WHERE b.Activo = 1;
    END

    -- BUSCAR POR ID
    IF @Accion = 'I'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE IdBien = @IdBien;
    END

    -- BUSCAR POR CÓDIGO INVENTARIO
    IF @Accion = 'C'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE CodigoInventario = @CodigoInventario;
    END

    -- BUSCAR POR CÓDIGO PATRIMONIAL
    IF @Accion = 'P'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE CodigoPatrimonial = @CodigoPatrimonial;
    END

    -- BUSCAR POR SERIE
    IF @Accion = 'S'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE NumeroSerie = @NumeroSerie;
    END

    -- BUSCAR POR DESCRIPCIÓN
    IF @Accion = 'D'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE Descripcion LIKE '%' + @Descripcion + '%';
    END

    -- BUSCAR POR ÁREA
    IF @Accion = 'A'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE IdArea = @IdArea
          AND Activo = 1;
    END

    -- BUSCAR POR ESTADO
    IF @Accion = 'E'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE IdEstadoBien = @IdEstadoBien
          AND Activo = 1;
    END

    -- LISTAR TODOS
    IF @Accion = 'T'
    BEGIN
        SELECT *
        FROM Bienes;
    END

    -- LISTAR INACTIVOS
    IF @Accion = 'N'
    BEGIN
        SELECT *
        FROM Bienes
        WHERE Activo = 0;
    END
END
