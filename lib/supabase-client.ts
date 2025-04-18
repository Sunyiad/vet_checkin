// Add this function to check database connection more efficiently
export async function checkDatabaseConnection() {
  try {
    const supabase = createServerSupabaseClient()

    // Use a simple, efficient query that doesn't parse complex parameters
    const { data, error } = await supabase.from("pg_stat_database").select("1").limit(1)

    if (error) {
      console.error("Database connection check failed:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("Database connection check error:", error)
    return false
  }
}
