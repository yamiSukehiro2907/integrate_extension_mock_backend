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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_status VARCHAR(100) NOT NULL DEFAULT 'NOT_STARTED',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100),
        joined_at TIMESTAMP DEFAULT NULL
      );
    `);

    console.log("✅ All tables created successfully");
  } catch (error: any) {
    console.error("❌ Error creating tables:", error.message);
    throw error;
  } finally {
    client.release();
  }
};
