import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

// Utility function for paginated property enrichment
export async function enrichPropertiesWithPagination(
  convexClient: ConvexHttpClient,
  batchSize: number = 100
) {
  try {
    // Get total count of properties
    const totalCount = await convexClient.query(api.enrich_properties.getTotalPropertiesCount);
    
    if (totalCount === 0) {
      return { success: true, message: "No properties to enrich" };
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process properties in batches
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      // Get batch of properties
      const properties = await convexClient.query(
        api.enrich_properties.getPropertiesForEnrichment,
        { offset, limit: batchSize }
      );

      if (properties.length === 0) break;

      // Extract property IDs for this batch
      const propertyIds = properties.map(p => p.propertyId);

      // Enrich this batch
      const batchResults = await convexClient.mutation(
        api.enrich_properties.enrichPropertiesBatch,
        { propertyIds }
      );

      // Count results
      processedCount += properties.length;
      successCount += batchResults.filter(r => r.success).length;
      errorCount += batchResults.filter(r => !r.success).length;

      // Log progress
      console.log(`Processed ${processedCount}/${totalCount} properties (${Math.round(processedCount/totalCount*100)}%)`);
    }

    return {
      success: true,
      message: `Enrichment complete: ${successCount} successful, ${errorCount} failed`,
      stats: {
        total: totalCount,
        processed: processedCount,
        successful: successCount,
        failed: errorCount
      }
    };

  } catch (error) {
    console.error("Enrichment error:", error);
    return {
      success: false,
      message: `Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Simple enrichment function for small datasets
export async function enrichAllPropertiesSimple(
  convexClient: ConvexHttpClient
) {
  try {
    const results = await convexClient.mutation(api.enrich_properties.enrichAllProperties);
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Enrichment complete: ${successCount} successful, ${errorCount} failed`,
      stats: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    };
  } catch (error) {
    console.error("Enrichment error:", error);
    return {
      success: false,
      message: `Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 