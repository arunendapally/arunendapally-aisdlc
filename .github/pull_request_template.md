### Testing
- [ ] Local tests pass
- [ ] Lint/build clean
- [ ] Mutation testing shows guards can fail
- [ ] Baseline test count recorded and verified

### Risk Assessment
- **Risk Level**: Low / Medium / High (select one)
  - Low: Documentation, copy, internal-only features, additive changes behind flags
  - Medium: Ordinary product changes, caching, auto-updater, system prompts  
  - High: Highest-risk code, sensitive paths, CI/workflow files, billing systems
- **Justification**: Brief explanation of why this risk level was selected

### How to Revert
- [ ] One-line command available (e.g., feature flag toggle, git revert)
- [ ] Database migration rollback procedure documented
- [ ] Deployment rollback test verified in staging

### Code Review
- [ ] `/code-review` skill run and findings addressed
- [ ] `/security-review` skill run if handling sensitive data
- [ ] Review depth matches risk level (Quick/Standard/Deep)
- [ ] All review findings fixed or resolved with justification

### AI SDLC Process
- [ ] Constitution reviewed and gate criteria met
- [ ] Brief approved and aligned with goals
- [ ] Spec completed and reviewed
- [ ] Plan approved with architecture decisions
- [ ] Tasks implemented in order with associated tests
- [ ] Human gate approvals obtained at each stage

### Post-Merge
- [ ] Feature flag enabled for gradual rollout
- [ ] Monitoring/alerting in place for detection
- [ ] Rollback procedure tested and documented