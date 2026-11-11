import type { Member, ShareableRole } from "@repo/schemas";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SelectField } from "@/components/SelectField";
import { roleLabel } from "@/features/sharing/role-label";
import { m } from "@/paraglide/messages";

interface MemberRowProps {
	member: Member;
	isMe: boolean;
	/** The owner manages the other members; the owner's own role is fixed. */
	manageable: boolean;
	pending: boolean;
	onRoleChange: (role: ShareableRole) => void;
	onRemove: () => void;
}

export function MemberRow({
	member,
	isMe,
	manageable,
	pending,
	onRoleChange,
	onRemove,
}: MemberRowProps) {
	const name = member.name || member.email;

	return (
		<li className="flex flex-wrap items-center justify-between gap-2 py-3">
			<div className="min-w-0">
				<p className="break-words font-medium">
					{name}
					{isMe && (
						<span className="text-muted-foreground"> ({m.member_you()})</span>
					)}
				</p>
				{member.name && (
					<p className="break-words text-muted-foreground text-sm">
						{member.email}
					</p>
				)}
			</div>
			{manageable && member.role !== "owner" ? (
				<div className="flex items-center gap-1">
					<SelectField
						label={m.member_role_label({ name })}
						hideLabel
						tone="default"
						value={member.role}
						disabled={pending}
						options={[
							{ value: "editor", label: m.role_editor() },
							{ value: "viewer", label: m.role_viewer() },
						]}
						onChange={onRoleChange}
					/>
					<ConfirmButton
						label={m.remove_member_button()}
						ariaLabel={m.remove_member_label({ name })}
						title={m.remove_member_title({ name })}
						description={m.remove_member_text()}
						confirmLabel={m.remove_member_button()}
						pending={pending}
						onConfirm={onRemove}
					/>
				</div>
			) : (
				<span className="text-muted-foreground text-sm">
					{roleLabel(member.role)}
				</span>
			)}
		</li>
	);
}
