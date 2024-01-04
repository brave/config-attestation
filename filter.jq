{
    "github_repository": $GITHUB_REPOSITORY,
    "github_run_id": $GITHUB_RUN_ID,
    "github_run_date": now|todateiso8601,
    "zone_status": $ZONE_STATUS,
    "result": [
        .result[] | with_entries(
            select(.key | IN(
                "dns",
                "protocol",
                "proxy_protocol",
                "traffic_type",
                "modified_on"
            ))
        ) | with_entries(
            if .key == "dns" then
                {"key": "domain", "value": .value.name}
            else
                .
            end
        ) | select(.domain | test("((collector|star).wdp|fl|p2a|p2a-json|pcdn|translate).brave.com") )
    ]
}
