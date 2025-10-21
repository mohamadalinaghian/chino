BACKUP_DIR ?= ~/backup

.PHONY: backup backup_rotate backup_restore_notes

_guard_prod:
	@if [[ "$(ENV)" != "prod" ]]; then \
		echo "✖ backup allowed only when ENV=prod (current: $(ENV))"; \
		exit 1; \
	fi

backup: _guard_prod
	@set -euo pipefail; \
	# --- Expand ~ safely (portable)
	BD="$(BACKUP_DIR)"; \
	BD="$$(eval echo $$BD)"; \
	# --- Jalali timestamp from backend container (fallback to Gregorian)
	DATE="$$( \
		$(DOCKER) exec backend python -c '\
try:\
    from persiantools.jdatetime import JalaliDateTime as JDT;\
    try:\
        from zoneinfo import ZoneInfo; tz = ZoneInfo("Asia/Tehran")\
    except Exception:\
        import pytz; tz = pytz.timezone("Asia/Tehran")\
    print(JDT.now(tz).strftime("%Y%m%d_%H%M%S"))\
except Exception:\
    print("")' 2>/dev/null || true \
	)"; \
	if [[ -z "$$DATE" ]]; then DATE="$$(TZ=Asia/Tehran date +%Y%m%d_%H%M%S)"; fi; \
	DEST="$$BD/$$DATE"; \
	mkdir -p "$$DEST"; \
	echo "==> [$$DATE] starting backup into $$DEST"; \
	\
	echo "==> dumping GLOBALS (roles/grants)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dumpall --globals-only -U "$$POSTGRES_USER"' \
		> "$$DEST/globals.sql"; \
	\
	echo "==> dumping DB (custom format, compressed)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -Fc -Z9' \
		> "$$DEST/db.custom.dump"; \
	\
	echo "==> dumping DB (plain SQL)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
		> "$$DEST/db.plain.sql"; \
	\
	echo "==> dumping DB (schema only)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -s' \
		> "$$DEST/db.schema.sql"; \
	\
	echo "==> archiving media directory from backend"; \
	if $(DOCKER) exec backend sh -lc 'test -d /app/media'; then \
		$(DOCKER) exec backend sh -lc 'tar -C /app -czf - media' > "$$DEST/media.tgz"; \
	else \
		echo "   (no /app/media — skipping)"; \
	fi; \
	\
	echo "==> archiving static directory from backend"; \
	if $(DOCKER) exec backend sh -lc 'test -d /app/static'; then \
		$(DOCKER) exec backend sh -lc 'tar -C /app -czf - static' > "$$DEST/static.tgz"; \
	else \
		echo "   (no /app/static — skipping)"; \
	fi; \
	\
	echo "==> checksums"; \
	cd "$$DEST"; \
	FILES=""; \
	for f in globals.sql db.custom.dump db.plain.sql db.schema.sql media.tgz static.tgz; do \
		[[ -f "$$f" ]] && FILES="$$FILES $$f"; \
	done; \
	if [[ -n "$$FILES" ]]; then sha256sum $$FILES > SHA256SUMS.txt; else touch SHA256SUMS.txt; fi; \
	echo "==> backup completed: $$DEST"

KEEP_DAYS ?= 7
backup_rotate:
	@set -euo pipefail; \
	BD="$(BACKUP_DIR)"; BD="$$(eval echo $$BD)"; \
	if [[ ! -d "$$BD" ]]; then echo "no $$BD to rotate"; exit 0; fi; \
	echo "==> pruning backups older than $(KEEP_DAYS) days in $$BD"; \
	find "$$BD" -maxdepth 1 -mindepth 1 -type d -mtime +$(KEEP_DAYS) -print -exec rm -rf {} \; || true; \
	echo "==> rotation done"

backup_restore_notes:
	@printf "%b" "\
Disaster restore (high-level):\n\n\
# 1) Roles / globals\n\
psql -U postgres -h <host> -f globals.sql\n\n\
# 2) DB (preferred: custom dump)\n\
createdb <new_db>\n\
pg_restore -U <user> -d <new_db> -c --if-exists db.custom.dump\n\n\
#    or from plain SQL (slower, readable)\n\
psql -U <user> -d <new_db> -f db.plain.sql\n\n\
# 3) Media / Static\n\
tar -xzf media.tgz -C /app\n\
tar -xzf static.tgz -C /app\n"
