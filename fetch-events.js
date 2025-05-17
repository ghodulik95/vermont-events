import fs from "fs/promises";
import fetch from "node-fetch";
// Fetch the online address for an event via GraphQL
async function fetchExtraEventInfo(eventId, endpoint) {
  const query = `
    query GetEvent($uuid: UUID!) {
      event(uuid: $uuid) {
        onlineAddress
        description
      }
    }
  `;
  const response = await fetch(`${endpoint}/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { uuid: eventId } })
  });
  const json = await response.json();
  return {
           onlineAddress: json?.data?.event?.onlineAddress || null,
           description: json?.data?.event?.description || null
         };
}

// Convert raw API data into simplified event objects
async function simplifyEvents(rawData, endpoint) {
  const events = rawData?.data?.searchEvents?.elements;
  if (!Array.isArray(events)) return [];
  console.log(rawData);
  return Promise.all(events.map(async event => {
    const extraData = await fetchExtraEventInfo(event.uuid, endpoint);
    return {
      id: event.id,
      title: event.title,
      beginsOn: event.beginsOn,
      username: event.attributedTo?.preferredUsername || null,
      url: event.url,
      onlineAddress: extraData.onlineAddress,
      description: extraData.description,
      address: {
        geom: event.physicalAddress?.geom || null,
        description: event.physicalAddress?.description || null,
        street: event.physicalAddress?.street || null,
        locality: event.physicalAddress?.locality || "Unknown town",
        region: event.physicalAddress?.region || null,
        postalCode: event.physicalAddress?.postalCode || null,
        country: event.physicalAddress?.country || null
      },
      category: event.category || "UNCATEGORIZED"
    };
  }));
}

async function main() {
  const configRaw = await fs.readFile("public/config.json", "utf-8");
  const config = JSON.parse(configRaw);
  // GraphQL query for fetching events
  const query = `
    query SearchEvents($limit: Int) {
      searchEvents(limit: $limit) {
        total
        elements {
          uuid
          id
          title
          url
          beginsOn
          category
          physicalAddress {
            ...AdressFragment
          }
          organizerActor {
            preferredUsername
          }
          attributedTo {
            preferredUsername
          }
        }
      }
    }
    fragment AdressFragment on Address {
      id
      description
      geom
      street
      locality
      postalCode
      region
      country
      type
      url
      originId
      timezone
    }
  `;
  const variables = {
    beginsOn: new Date().toISOString(),
    limit: 1000
  };
  const resp = await fetch(`${config.mobilizonUrl}/api/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables })
      });
  console.log(resp);
  const raw = await resp.json();

  // 2) Simplify
  const events = await simplifyEvents(raw, config.mobilizonUrl);

  // 3) Write JSON
  await fs.mkdir("public/data", { recursive: true });
  await fs.writeFile(
    "public/data/events.json",
    JSON.stringify(events, null, 2),
    "utf-8"
  );
  console.log(`Wrote ${events.length} events to public/data/events.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
