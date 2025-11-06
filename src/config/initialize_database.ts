import pool from "./database";

export const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE status AS ENUM ('completed', 'ongoing', 'not_started');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        version VARCHAR(50) DEFAULT '1.0.0',
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_status status DEFAULT 'not_started',
        authToken TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_details (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        rules_md TEXT,
        openapi_file JSONB,
        schema JSONB,
        version VARCHAR(50) DEFAULT '1.0.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS endpoints (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        version VARCHAR(50) DEFAULT '1.0.0',
        path VARCHAR(100),
        request_format JSONB,
        response_format JSONB,
        endpoint_status status DEFAULT 'not_started',
        completed_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  } finally {
    client.release();
  }
};
