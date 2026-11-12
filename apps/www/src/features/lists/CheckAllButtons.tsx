import { Button } from "@repo/ui";
import { CheckCheckIcon, RotateCcwIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

interface CheckAllButtonsProps {
	openCount: number;
	checkedCount: number;
	onCheckAll: (done: boolean) => void;
}

/** Checks or unchecks every item of the list at once. */
export function CheckAllButtons({
	openCount,
	checkedCount,
	onCheckAll,
}: CheckAllButtonsProps) {
	return (
		<fieldset aria-label={m.all_items_label()} className="flex flex-wrap gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={openCount === 0}
				onClick={() => onCheckAll(true)}
			>
				<CheckCheckIcon aria-hidden />
				{m.check_all_button()}
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={checkedCount === 0}
				onClick={() => onCheckAll(false)}
			>
				<RotateCcwIcon aria-hidden />
				{m.uncheck_all_button()}
			</Button>
		</fieldset>
	);
}
