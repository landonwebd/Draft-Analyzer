type FantasyTeamProps = {
  fantasyTeam: string;
};

export default function FantasyTeamDisplay({ fantasyTeam }: FantasyTeamProps) {
  const displayName =
    fantasyTeam === "ALL" ? (
      "All Fantasy Teams"
    ) : (
      <>
        <span className="font-bold">Team:</span> {fantasyTeam}
      </>
    );
  return <h3 className="text-2xl mt-5">{displayName}</h3>;
}
