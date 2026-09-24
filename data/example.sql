CREATE PROCEDURE sp_loginUser (
    IN  in_username     VARCHAR(50),
    IN  in_passwordHash VARCHAR(255),
    OUT out_userId      INT,
    OUT out_result      VARCHAR(30)
)
BEGIN
    DECLARE v_storedHash VARCHAR(255);
    DECLARE v_isLocked   BOOLEAN;
    DECLARE v_userId     INT;

    SELECT pk_user, passwordHash, isLocked
    INTO   v_userId, v_storedHash, v_isLocked
    FROM   User WHERE username = in_username LIMIT 1;

    IF v_userId IS NULL THEN
        INSERT INTO LoginAttempt (fk_user_attempts, username, success)
        VALUES (NULL, in_username, FALSE);
        SET out_result = 'NOT_FOUND';
        SET out_userId = NULL;
    ELSEIF v_isLocked THEN
        INSERT INTO LoginAttempt (fk_user_attempts, username, success)
        VALUES (v_userId, in_username, FALSE);
        SET out_result = 'LOCKED';
        SET out_userId = NULL;
    ELSE
        IF v_storedHash = in_passwordHash THEN
            UPDATE User SET failedAttempts = 0 WHERE pk_user = v_userId;
            INSERT INTO LoginAttempt (fk_user_attempts, username, success)
            VALUES (v_userId, in_username, TRUE);
            SET out_result = 'SUCCESS';
            SET out_userId = v_userId;
        ELSE
            INSERT INTO LoginAttempt (fk_user_attempts, username, success)
            VALUES (v_userId, in_username, FALSE);
            SET out_result = 'INVALID_CREDENTIALS';
            SET out_userId = NULL;
        END IF;
    END IF;
END;